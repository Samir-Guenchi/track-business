import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type { Channel } from '@trackecom/contracts';
import { z } from 'zod';
import type { MessageProvider, Receipt } from '../application/ports/delivery.ports.js';

const ReceiptBody = z.object({
  providerId: z.string().min(1),
  status: z.enum(['delivered', 'failed']),
  at: z.iso.datetime().optional(),
});

export interface FakeSent {
  readonly providerId: string;
  readonly channel: Channel;
  readonly to: string;
  readonly body: string;
}

/**
 * The provider until an SMS gateway and WhatsApp Business are chosen (ADR-0004): nothing leaves
 * the server. It logs that a message was "sent" (never the phone or text) and keeps the last
 * messages in memory for tests. Its receipt body is `{ providerId, status, at? }`.
 */
export class FakeMessageProvider implements MessageProvider {
  readonly name = 'fake';
  readonly sent: FakeSent[] = [];
  private readonly logger = new Logger(FakeMessageProvider.name);

  send(message: { channel: Channel; to: string; body: string }) {
    const providerId = randomUUID();
    this.sent.push({ providerId, ...message });
    if (this.sent.length > 100) this.sent.shift();
    this.logger.log(
      { providerId, channel: message.channel },
      'fake provider: message not really sent',
    );
    return Promise.resolve({ providerId, costCentimes: 0 });
  }

  parseReceipt(body: unknown): Receipt | null {
    const parsed = ReceiptBody.safeParse(body);
    if (!parsed.success) return null;
    const at = parsed.data.at ? new Date(parsed.data.at) : new Date();
    return { providerId: parsed.data.providerId, status: parsed.data.status, at };
  }
}
