import { Inject, Injectable } from '@nestjs/common';
import type { ListMessagesQuery, NotificationSettings, UsageResponse } from '@trackecom/contracts';
import { OptOutNotFoundError } from '../domain/notification.errors.js';
import { type MessageReads, type OptOutStore, type SettingsStore } from './ports/stores.js';

/** One place for the store's switches: settings, opt-outs and what was sent. */
export interface AdminStores {
  readonly settings: SettingsStore;
  readonly optOuts: OptOutStore;
  readonly messages: MessageReads;
}

export const ADMIN_STORES = Symbol('AdminStores');

@Injectable()
export class NotificationAdminService {
  constructor(@Inject(ADMIN_STORES) private readonly stores: AdminStores) {}

  settings(storeId: string): Promise<NotificationSettings> {
    return this.stores.settings.get(storeId);
  }

  async replaceSettings(storeId: string, settings: NotificationSettings) {
    await this.stores.settings.save(storeId, settings);
    return settings;
  }

  optOut(storeId: string, phone: string): Promise<void> {
    return this.stores.optOuts.add(storeId, phone);
  }

  async optIn(storeId: string, phone: string): Promise<void> {
    if (!(await this.stores.optOuts.remove(storeId, phone))) throw new OptOutNotFoundError();
  }

  messages(storeId: string, query: ListMessagesQuery) {
    return this.stores.messages.list(storeId, query);
  }

  /** `month` is YYYY-MM, Algiers time. */
  async usage(storeId: string, month: string): Promise<UsageResponse> {
    const [year, monthNumber] = month.split('-').map(Number) as [number, number];
    const from = new Date(Date.UTC(year, monthNumber - 1, 1) - 3_600_000);
    const to = new Date(Date.UTC(year, monthNumber, 1) - 3_600_000);
    return { month, ...(await this.stores.messages.usage(storeId, { from, to })) };
  }
}
