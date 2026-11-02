import type { CallScript, ScriptLanguage } from '@trackecom/contracts';
import type { AgentTotals } from '../../domain/agent-stats.js';

export const CONFIRMATION_CONTENT = Symbol('ConfirmationContentRepository');

/** Call scripts and call statistics of a store. */
export interface ConfirmationContentRepository {
  scripts(storeId: string): Promise<CallScript[]>;
  script(storeId: string, language: ScriptLanguage): Promise<string | null>;
  saveScript(storeId: string, script: CallScript): Promise<void>;
  agentTotals(storeId: string, period: { from: Date; to: Date }): Promise<AgentTotals[]>;
}
