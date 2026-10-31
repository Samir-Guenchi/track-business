import { Injectable } from '@nestjs/common';
import { type BulkOrdersRequest, type BulkOrdersResponse, roleCan } from '@trackecom/contracts';
import { DomainError } from '@trackecom/service-kit';
import { AccessDeniedError } from '../../../authorization/access.errors.js';
import { ChangeStatusUseCase } from './change-status.use-case.js';
import type { OrderActor } from './order-actor.js';
import { OrderAdminUseCases } from './order-admin.use-cases.js';

/**
 * Applies one action to many orders, one at a time, so each order keeps its own transaction,
 * audit row and event. A failing order is reported and does not stop the others.
 */
@Injectable()
export class BulkOrdersUseCase {
  constructor(
    private readonly statuses: ChangeStatusUseCase,
    private readonly admin: OrderAdminUseCases,
  ) {}

  async execute(actor: OrderActor, request: BulkOrdersRequest): Promise<BulkOrdersResponse> {
    if (request.action !== 'change_status' && !roleCan(actor.role, 'orders.write'))
      throw new AccessDeniedError();
    const apply = this.actionFor(actor, request);
    const result: { succeeded: string[]; failed: { orderId: string; code: string }[] } = {
      succeeded: [],
      failed: [],
    };
    for (const orderId of new Set(request.orderIds)) {
      try {
        await apply(orderId);
        result.succeeded.push(orderId);
      } catch (error) {
        if (!(error instanceof DomainError)) throw error;
        result.failed.push({ orderId, code: error.code });
      }
    }
    return result;
  }

  private actionFor(actor: OrderActor, request: BulkOrdersRequest): (id: string) => Promise<unknown> {
    switch (request.action) {
      case 'change_status':
        return (id) => this.statuses.execute(actor, id, { status: request.status });
      case 'assign_agent':
        return (id) => this.admin.assignAgent(actor, id, request.agentId);
      case 'add_tag':
        return (id) => this.admin.addTag(actor, id, request.tag);
      case 'remove_tag':
        return (id) => this.admin.removeTag(actor, id, request.tag);
      case 'delete':
        return (id) => this.admin.delete(actor, id);
    }
  }
}
