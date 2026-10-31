import { randomBytes, randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { type CreatedShipment, CarrierError, createShipmentOnce } from '@trackecom/carriers';
import {
  type EventEnvelope,
  SHIPMENT_EVENTS,
  type ShipmentCreatedEvent,
  type ShipmentFailedEvent,
  type ShipRequestedEvent,
  ShipRequestedEventSchema,
} from '@trackecom/contracts';
import { type EventOrigin, outboxMessage } from '../../../shared/outbox-message.js';
import { CarrierAccountsService } from '../../carriers/application/carrier-accounts.service.js';
import {
  CarrierNotConnectedError,
  CarrierNotSupportedError,
} from '../../carriers/domain/carrier-account.errors.js';
import { nextPollAt } from '../../tracking/domain/poll-schedule.js';
import { failureFor, toShipmentRequest } from '../domain/ship-request.js';
import { UnknownPlaceError } from '../domain/shipment.errors.js';
import { PlaceNamesResolver } from './place-names.js';
import { SHIPMENT_REPOSITORY, type ShipmentRepository } from './ports/shipment.repository.js';

export type CreateResult = 'created' | 'duplicate' | 'failed';
type Failure = Pick<ShipmentFailedEvent, 'reason' | 'message'>;

/** Random, URL-safe, 22 characters: the customer's tracking link (#34). */
const newPublicCode = () => randomBytes(16).toString('base64url');

/**
 * Creates the parcel for one ship request (#31, #32). Safe to run twice: the reference is unique
 * per store, and the carrier call looks the parcel up before retrying.
 */
@Injectable()
export class CreateShipmentUseCase {
  constructor(
    @Inject(SHIPMENT_REPOSITORY) private readonly shipments: ShipmentRepository,
    private readonly carriers: CarrierAccountsService,
    private readonly places: PlaceNamesResolver,
  ) {}

  async execute(event: EventEnvelope): Promise<CreateResult> {
    const request = ShipRequestedEventSchema.parse(event.data);
    if (await this.shipments.exists(event.storeId, request.reference)) return 'duplicate';
    const origin: EventOrigin = { ...event, now: new Date() };
    try {
      const parcel = await this.createParcel(event.storeId, request);
      return await this.save(origin, request, parcel);
    } catch (error) {
      const failure = failureOf(error);
      if (!failure) throw error;
      const data: ShipmentFailedEvent = { ...pick(request), ...failure };
      await this.shipments.recordFailure([outboxMessage(origin, SHIPMENT_EVENTS.failed, data)]);
      return 'failed';
    }
  }

  private async createParcel(storeId: string, request: ShipRequestedEvent) {
    const { adapter, ctx } = await this.carriers.connection(storeId, request.carrier);
    const parcel = toShipmentRequest(request, await this.places.resolve(request));
    return createShipmentOnce({ adapter, ctx, request: parcel });
  }

  private async save(origin: EventOrigin, request: ShipRequestedEvent, parcel: CreatedShipment) {
    const shipment = {
      id: randomUUID(),
      storeId: origin.storeId,
      orderId: request.orderId,
      carrier: request.carrier,
      reference: request.reference,
      trackingNumber: parcel.trackingNumber,
      publicCode: newPublicCode(),
      nextPollAt: nextPollAt('created', origin.now) ?? origin.now,
    };
    const data: ShipmentCreatedEvent = {
      shipmentId: shipment.id,
      ...pick(request),
      trackingNumber: parcel.trackingNumber,
      publicCode: shipment.publicCode,
      labelUrl: parcel.labelUrl,
    };
    const saved = await this.shipments.create(shipment, [
      outboxMessage(origin, SHIPMENT_EVENTS.created, data),
    ]);
    return saved ? 'created' : 'duplicate';
  }
}

const pick = ({ orderId, reference, carrier }: ShipRequestedEvent) => ({
  orderId,
  reference,
  carrier,
});

/** Failures the seller must act on are reported; anything else is retried by the bus. */
function failureOf(error: unknown): Failure | null {
  if (error instanceof CarrierNotConnectedError) {
    return { reason: 'not_connected', message: 'Connect this carrier before shipping with it' };
  }
  if (error instanceof CarrierNotSupportedError) {
    return { reason: 'not_supported', message: 'TrackEcom does not support this carrier yet' };
  }
  if (error instanceof UnknownPlaceError) {
    return { reason: 'invalid_request', message: 'Unknown wilaya or commune on the order' };
  }
  if (error instanceof CarrierError) {
    return { reason: failureFor(error.kind), message: error.message.slice(0, 500) };
  }
  return null;
}
