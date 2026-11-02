import { Inject, Injectable } from '@nestjs/common';
import type { AgentStatsQuery, AgentStatsResponse, CallScript } from '@trackecom/contracts';
import { type Clock, ORDERS_PORTS } from '../../orders/application/ports/orders.ports.js';
import { statsPeriod, toAgentStats } from '../domain/agent-stats.js';
import {
  CONFIRMATION_CONTENT,
  type ConfirmationContentRepository,
} from './ports/confirmation-content.repository.js';

/** Editable call scripts (AR / FR / Darija) and per-agent numbers for managers. */
@Injectable()
export class ConfirmationContentService {
  constructor(
    @Inject(CONFIRMATION_CONTENT) private readonly content: ConfirmationContentRepository,
    @Inject(ORDERS_PORTS.clock) private readonly now: Clock,
  ) {}

  scripts(storeId: string): Promise<CallScript[]> {
    return this.content.scripts(storeId);
  }

  async saveScript(storeId: string, script: CallScript): Promise<CallScript> {
    await this.content.saveScript(storeId, script);
    return script;
  }

  async stats(storeId: string, query: AgentStatsQuery): Promise<AgentStatsResponse> {
    const period = statsPeriod(this.now(), query);
    const totals = await this.content.agentTotals(storeId, period);
    return {
      from: period.from.toISOString(),
      to: period.to.toISOString(),
      items: totals.map(toAgentStats),
    };
  }
}
