import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { TrackingUpdate } from '@trackecom/carriers';
import { eventKey } from '../domain/event-key.js';
import { nextPollAt } from '../domain/poll-schedule.js';
import { planTimeline } from '../domain/timeline.js';
import { TrackingConflictError } from '../domain/tracking.errors.js';
import {
  type Decide,
  type IncomingEvent,
  type IngestDecision,
  TRACKING_REPOSITORY,
  type TrackingRepository,
} from './ports/tracking.repository.js';
import { trackingOutbox } from './tracking-outbox.js';

export type Clock = () => Date;
export const TRACKING_CLOCK = Symbol('TrackingClock');

const MAX_ATTEMPTS = 3;

const toIncoming = (update: TrackingUpdate): IncomingEvent[] =>
  update.events.map((event) => ({
    status: event.status,
    carrierStatus: event.rawStatus,
    at: event.at,
    location: event.location,
    note: event.note,
    failureReason: event.failureReason,
    key: eventKey({ carrierStatus: event.rawStatus, at: event.at, location: event.location }),
  }));

/**
 * The one way carrier updates (webhook or poll) enter the timeline. Idempotent: a replayed event
 * is stored once and changes nothing the second time.
 */
@Injectable()
export class TrackingIngestService {
  private readonly logger = new Logger(TrackingIngestService.name);

  constructor(
    @Inject(TRACKING_REPOSITORY) private readonly repository: TrackingRepository,
    @Inject(TRACKING_CLOCK) private readonly now: Clock,
  ) {}

  /** null when no shipment has this tracking number (a parcel created outside TrackEcom). */
  async ingest(carrier: string, update: TrackingUpdate): Promise<IngestDecision | null> {
    const input = { carrier, trackingNumber: update.trackingNumber, events: toIncoming(update) };
    const decide = this.decider();
    for (let attempt = 1; ; attempt += 1) {
      try {
        return await this.repository.ingest(input, decide);
      } catch (error) {
        if (!(error instanceof TrackingConflictError) || attempt >= MAX_ATTEMPTS) throw error;
        this.logger.debug(`Retrying ${carrier} ${update.trackingNumber} after a conflict`);
      }
    }
  }

  private decider(): Decide {
    const correlationId = randomUUID();
    return (shipment, fresh) => {
      const now = this.now();
      const plan = planTimeline(shipment, fresh);
      const outbox = trackingOutbox({ shipment, correlationId, now }, plan);
      return { plan, nextPollAt: nextPollAt(plan.status, now), outbox };
    };
  }
}
