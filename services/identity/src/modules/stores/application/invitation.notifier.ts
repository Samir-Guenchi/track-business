import { Inject, Injectable } from '@nestjs/common';
import { type Env, ENV } from '../../../config/env.schema.js';
import { AUTH_PORTS, type AuthMailer } from '../../auth/application/ports/auth.ports.js';
import type { NewInvitation } from './ports/stores.ports.js';

/**
 * Emails the link for email invitations. Phone invitations get no SMS yet (#46): the manager
 * shares the returned link (WhatsApp is how most Algerian teams do it today).
 */
@Injectable()
export class InvitationNotifier {
  constructor(
    @Inject(AUTH_PORTS.mailer) private readonly mailer: AuthMailer,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async notify(invitation: NewInvitation, token: string): Promise<string> {
    const url = new URL('/ar/invite', this.env.APP_URL);
    url.searchParams.set('token', token);
    if (invitation.email) {
      // The invitee's language is unknown until they sign in; Arabic is the product default.
      await this.mailer.send({
        kind: 'store_invitation',
        to: invitation.email,
        locale: 'ar',
        token,
      });
    }
    return url.toString();
  }
}
