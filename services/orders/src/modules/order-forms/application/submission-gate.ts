import { createHash, randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { SubmitFormOrderRequest } from '@trackecom/contracts';
import { type Clock, ORDERS_PORTS } from '../../orders/application/ports/orders.ports.js';
import type { OrderFormRecord } from '../domain/order-form.js';
import { SubmissionRefusedError } from '../domain/order-form.errors.js';
import { screenSubmission } from '../domain/submission-screen.js';
import { SUBMISSION_LOG, type SubmissionLog, type SubmissionRecord } from './order-forms.ports.js';
import { PublicFormsService } from './public-forms.service.js';

export interface Submission {
  readonly key: string;
  readonly body: SubmitFormOrderRequest;
  readonly ip: string;
}

export type Attempt = Omit<SubmissionRecord, 'outcome'>;

/**
 * The anti-spam door of public forms (#134). Every attempt is logged, refused or not, so the
 * limits count bots that keep retrying and the seller can see which campaigns bring orders.
 */
@Injectable()
export class SubmissionGate {
  constructor(
    private readonly forms: PublicFormsService,
    @Inject(SUBMISSION_LOG) private readonly log: SubmissionLog,
    @Inject(ORDERS_PORTS.clock) private readonly now: Clock,
  ) {}

  /** The enabled form and the logged attempt, or a refusal (already logged). */
  async admit({ key, body, ip }: Submission): Promise<{ form: OrderFormRecord; attempt: Attempt }> {
    const form = await this.forms.enabledForm(key);
    const attempt = this.attemptOf(form, body, ip);
    const history = await this.log.history({ ...attempt, now: attempt.createdAt });
    const refusal = screenSubmission(body.website, history);
    if (refusal) {
      await this.log.record({ ...attempt, outcome: refusal });
      throw new SubmissionRefusedError(refusal);
    }
    return { form, attempt };
  }

  accepted(attempt: Attempt, orderId: string): Promise<void> {
    return this.log.record({ ...attempt, orderId, outcome: 'created' });
  }

  private attemptOf(form: OrderFormRecord, body: SubmitFormOrderRequest, ip: string): Attempt {
    return {
      id: randomUUID(),
      formId: form.id,
      storeId: form.storeId,
      orderId: null,
      phone: body.phone,
      productId: body.productId,
      ipHash: createHash('sha256').update(`order-form:${ip}`).digest('hex'),
      utm: body.utm ?? {},
      createdAt: this.now(),
    };
  }
}
