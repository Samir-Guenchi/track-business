import { Inject, Injectable } from '@nestjs/common';
import { type Transporter, createTransport } from 'nodemailer';
import { type Env, ENV } from '../../../../config/env.schema.js';
import type { AuthEmail, AuthMailer } from '../../application/ports/auth.ports.js';
import { renderAuthEmail } from './auth-email.templates.js';

/** SMTP delivery (Mailpit locally). Moves to the notifications service queue with #37/#46. */
@Injectable()
export class SmtpAuthMailer implements AuthMailer {
  private readonly transport: Transporter;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.transport = createTransport(env.SMTP_URL);
  }

  async send(email: AuthEmail): Promise<void> {
    const rendered = renderAuthEmail(email, this.env.APP_URL);
    await this.transport.sendMail({ from: this.env.MAIL_FROM, to: email.to, ...rendered });
  }
}
