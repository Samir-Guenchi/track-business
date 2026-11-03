import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  type Invoice,
  type ListInvoicesQuery,
  ListInvoicesQuerySchema,
  type ListInvoicesResponse,
} from '@trackecom/contracts';
import { RequirePermission, ZodValidationPipe } from '@trackecom/service-kit';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { CurrentActor } from '../../orders/interface/current-actor.decorator.js';
import { OrderIdPipe } from '../../orders/interface/orders.controller.js';
import { InvoiceUseCases } from '../application/invoice.use-cases.js';

/** Invoices and credit notes (#140): money people issue them, accountants read them. */
@Controller()
export class InvoicesController {
  constructor(private readonly invoices: InvoiceUseCases) {}

  @Post('orders/:id/invoice')
  @RequirePermission('money.manage')
  issue(@Param('id', OrderIdPipe) id: string, @CurrentActor() actor: OrderActor): Promise<Invoice> {
    return this.invoices.issue(actor, id);
  }

  @Post('invoices/:id/credit-note')
  @RequirePermission('money.manage')
  creditNote(
    @Param('id', OrderIdPipe) id: string,
    @CurrentActor() actor: OrderActor,
  ): Promise<Invoice> {
    return this.invoices.creditNote(actor, id);
  }

  @Get('invoices')
  @RequirePermission('money.read')
  async list(
    @Query(new ZodValidationPipe(ListInvoicesQuerySchema)) query: ListInvoicesQuery,
    @CurrentActor() actor: OrderActor,
  ): Promise<ListInvoicesResponse> {
    return { items: await this.invoices.list(actor, query) };
  }

  @Get('invoices/:id')
  @RequirePermission('money.read')
  get(@Param('id', OrderIdPipe) id: string, @CurrentActor() actor: OrderActor): Promise<Invoice> {
    return this.invoices.get(actor, id);
  }
}
