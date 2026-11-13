import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '@trackecom/service-kit';
import { DELIVERY_PORTS, type MessageProvider, type MessageQueue } from './ports/delivery.ports.js';

export class UnknownReceiptError extends DomainError {
  readonly code = 'notifications.unknown_receipt';
  readonly kind = 'not_found';

  constructor() {
    super('No message matches this receipt');
  }
}

/** Delivery receipts from the provider: a sent message becomes delivered or failed. */
@Injectable()
export class ReceiptsService {
  constructor(
    @Inject(DELIVERY_PORTS.queue) private readonly queue: MessageQueue,
    @Inject(DELIVERY_PORTS.provider) private readonly provider: MessageProvider,
  ) {}

  async apply(providerName: string, body: unknown): Promise<void> {
    const receipt = providerName === this.provider.name ? this.provider.parseReceipt(body) : null;
    if (!receipt || !(await this.queue.applyReceipt(providerName, receipt))) {
      throw new UnknownReceiptError();
    }
  }
}
