import type {
  Channel,
  ListMessagesQuery,
  MessageLanguage,
  MessageStatus,
  NotificationSettings,
  NotificationTrigger,
  SkipReason,
  UsageResponse,
} from '@trackecom/contracts';

export interface TemplateKey {
  readonly trigger: NotificationTrigger;
  readonly channel: Channel;
  readonly language: MessageLanguage;
}

export interface StoredTemplate extends TemplateKey {
  readonly body: string;
}

export interface MessageRecord {
  readonly id: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly trigger: NotificationTrigger;
  readonly channel: Channel;
  readonly language: MessageLanguage;
  readonly status: MessageStatus;
  readonly skipReason: SkipReason | null;
  readonly shipmentId: string | null;
  readonly costCentimes: number | null;
  readonly queuedAt: Date;
  readonly sentAt: Date | null;
  readonly deliveredAt: Date | null;
}

export interface SettingsStore {
  /** The store's settings, or the defaults when it never saved any. */
  get(storeId: string): Promise<NotificationSettings>;
  save(storeId: string, settings: NotificationSettings): Promise<void>;
}

export interface TemplateStore {
  custom(storeId: string): Promise<StoredTemplate[]>;
  find(storeId: string, key: TemplateKey): Promise<string | null>;
  save(storeId: string, template: StoredTemplate): Promise<void>;
  /** false when the store had no own text for this key. */
  remove(storeId: string, key: TemplateKey): Promise<boolean>;
}

export interface OptOutStore {
  add(storeId: string, phone: string): Promise<void>;
  remove(storeId: string, phone: string): Promise<boolean>;
  has(storeId: string, phone: string): Promise<boolean>;
}

export interface MessageReads {
  list(
    storeId: string,
    query: ListMessagesQuery,
  ): Promise<{ items: MessageRecord[]; nextCursor: string | null }>;
  /** Counts and cost of messages queued in [from, to). */
  usage(storeId: string, range: { from: Date; to: Date }): Promise<Omit<UsageResponse, 'month'>>;
}

export const STORES = {
  settings: Symbol('SettingsStore'),
  templates: Symbol('TemplateStore'),
  optOuts: Symbol('OptOutStore'),
  messageReads: Symbol('MessageReads'),
} as const;
