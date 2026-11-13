import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import {
  type LogCallRequest,
  LogCallRequestSchema,
  type LogCallResponse,
  type NextCallQuery,
  NextCallQuerySchema,
  type NextCallResponse,
} from '@trackecom/contracts';
import { RequirePermission, ZodValidationPipe } from '@trackecom/service-kit';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { toOrderDto } from '../../orders/infrastructure/order.mapper.js';
import { CurrentActor } from '../../orders/interface/current-actor.decorator.js';
import { OrderIdPipe } from '../../orders/interface/orders.controller.js';
import { ConfirmationQueue } from '../application/confirmation-queue.js';
import { LogCallUseCase } from '../application/log-call.use-case.js';
import { toCallAttemptDto } from './call-attempt.dto.js';

/** The agent workspace (#29): take an order, log the call. */
@Controller('confirmation')
export class ConfirmationController {
  constructor(
    private readonly queue: ConfirmationQueue,
    private readonly logCall: LogCallUseCase,
  ) {}

  @Get('next')
  @RequirePermission('orders.confirm')
  async next(
    @Query(new ZodValidationPipe(NextCallQuerySchema)) query: NextCallQuery,
    @CurrentActor() actor: OrderActor,
  ): Promise<NextCallResponse> {
    const item = await this.queue.next(actor, query.language);
    if (!item) return { item: null };
    return {
      item: {
        order: toOrderDto(item.order),
        lockedUntil: item.lockedUntil.toISOString(),
        attemptsToday: item.attemptsToday,
        previousAttempts: item.previousAttempts.map(toCallAttemptDto),
        script: item.script,
        bestTime: item.bestTime,
      },
    };
  }

  @Post('orders/:id/release')
  @HttpCode(200)
  @RequirePermission('orders.confirm')
  async release(@Param('id', OrderIdPipe) id: string, @CurrentActor() actor: OrderActor) {
    return { released: await this.queue.release(actor, id) };
  }

  @Post('calls')
  @RequirePermission('orders.confirm')
  async log(
    @Body(new ZodValidationPipe(LogCallRequestSchema)) body: LogCallRequest,
    @CurrentActor() actor: OrderActor,
  ): Promise<LogCallResponse> {
    const { attempt, orderStatus } = await this.logCall.execute(actor, body);
    return { attempt: toCallAttemptDto(attempt), orderStatus };
  }
}
