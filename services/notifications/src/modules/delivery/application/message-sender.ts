import { Logger } from '@nestjs/common';
import type { LoopTask } from '@trackecom/events';
import type { OptOutStore, SettingsStore } from '../../messages/application/ports/stores.js';
import type { TemplateService } from '../../messages/application/template.service.js';
import { sendTime } from '../../messages/domain/quiet-hours.js';
import { renderTemplate } from '../../messages/domain/render.js';
import { retryDelayMs } from '../domain/triggers.js';
import {
  type ContactDirectory,
  type DueMessage,
  type MessageProvider,
  type MessageQueue,
  type ParcelDirectory,
  ProviderError,
  type SendOutcome,
} from './ports/delivery.ports.js';

/** Everything the sender reads, in one object (built by DeliveryModule). */
export interface SenderDeps {
  readonly queue: MessageQueue;
  readonly settings: SettingsStore;
  readonly templates: TemplateService;
  readonly optOuts: OptOutStore;
  readonly contacts: ContactDirectory;
  readonly parcels: ParcelDirectory;
  readonly provider: MessageProvider;
  /** Base of the public tracking page; the parcel's public code is appended. */
  readonly trackingUrl: string;
}

const LEASE_MS = 60_000;
const BATCH = 20;

/**
 * Sends due messages (#46), on every replica: each batch is leased, so two replicas never send
 * the same message. A provider or orders outage is retried with growing waits.
 */
export class MessageSender implements LoopTask {
  readonly name = 'message-sender';
  private readonly logger = new Logger(MessageSender.name);

  constructor(private readonly deps: SenderDeps) {}

  async runOnce(): Promise<number> {
    const now = new Date();
    const due = await this.deps.queue.claimDue({
      now,
      until: new Date(now.getTime() + LEASE_MS),
      limit: BATCH,
    });
    for (const message of due) {
      await this.deps.queue.complete(message.id, await this.attempt(message));
    }
    return due.length;
  }

  private async attempt(message: DueMessage): Promise<SendOutcome> {
    try {
      return await this.send(message);
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      const retryable = !(error instanceof ProviderError) || error.retryable;
      const delay = retryable ? retryDelayMs(message.attempts) : null;
      if (delay === null) return { kind: 'failed', error: text };
      this.logger.warn(
        { messageId: message.id, attempt: message.attempts },
        `send retried: ${text}`,
      );
      const settings = await this.deps.settings.get(message.storeId);
      return {
        kind: 'retry',
        sendAfter: sendTime(new Date(Date.now() + delay), settings.quietHours),
        error: text,
      };
    }
  }

  private async send(message: DueMessage): Promise<SendOutcome> {
    const { settings, contacts, optOuts, provider } = this.deps;
    const store = await settings.get(message.storeId);
    if (!store.enabled) return { kind: 'skipped', reason: 'disabled' };
    const contact = await contacts.contactFor(message.storeId, message.orderId);
    if (!contact) return { kind: 'skipped', reason: 'no_contact' };
    if (await optOuts.has(message.storeId, contact.phone))
      return { kind: 'skipped', reason: 'opted_out' };
    const body = await this.render(message, {
      name: contact.name,
      ref: contact.ref,
      storeName: store.storeName,
    });
    const sent = await provider.send({ channel: message.channel, to: contact.phone, body });
    return { kind: 'sent', provider: provider.name, ...sent, at: new Date() };
  }

  private async render(
    message: DueMessage,
    who: { name: string; ref: string; storeName: string | null },
  ): Promise<string> {
    const { templates, parcels, trackingUrl } = this.deps;
    const [body, parcel] = await Promise.all([
      templates.bodyFor(message.storeId, message),
      message.shipmentId ? parcels.find(message.shipmentId) : Promise.resolve(null),
    ]);
    return renderTemplate(body, {
      name: who.name,
      ref: who.ref,
      store_name: who.storeName ?? '',
      carrier: parcel?.carrier ?? '',
      tracking_link: parcel ? `${trackingUrl.replace(/\/$/, '')}/${parcel.publicCode}` : '',
    });
  }
}
