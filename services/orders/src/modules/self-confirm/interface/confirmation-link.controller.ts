import { Controller, HttpCode, Inject, Param, Post } from '@nestjs/common';
import type { ConfirmationLink } from '@trackecom/contracts';
import { RequirePermission } from '@trackecom/service-kit';
import { type Env, ENV } from '../../../config/env.schema.js';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { CurrentActor } from '../../orders/interface/current-actor.decorator.js';
import { OrderIdPipe } from '../../orders/interface/orders.controller.js';
import { CreateLinkUseCase } from '../application/create-link.use-case.js';

/** Agents create a one-time link to send to a customer they cannot reach (#54). */
@Controller('orders')
export class ConfirmationLinkController {
  constructor(
    private readonly createLink: CreateLinkUseCase,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Post(':id/confirmation-link')
  @HttpCode(201)
  @RequirePermission('orders.confirm')
  async create(
    @Param('id', OrderIdPipe) id: string,
    @CurrentActor() actor: OrderActor,
  ): Promise<ConfirmationLink> {
    const { token, expiresAt } = await this.createLink.execute(actor, id);
    const url = `${this.env.SELF_CONFIRM_URL.replace(/\/$/, '')}/${token}`;
    return { url, expiresAt: expiresAt.toISOString() };
  }
}
