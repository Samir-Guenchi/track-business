import type { ConnectorCode, IntegrationStatus } from '@trackecom/contracts';

export const CONNECTION_REPOSITORY = Symbol('ConnectionRepository');

/** A connected shop without its credentials. */
export interface ConnectionRecord {
  readonly id: string;
  readonly storeId: string;
  readonly connector: ConnectorCode;
  readonly shopUrl: string;
  readonly shopName: string;
  readonly status: IntegrationStatus;
  readonly syncedThrough: Date | null;
  readonly lastSyncAt: Date | null;
  readonly ordersImported: number;
  readonly lastError: string | null;
}

export interface NewConnection {
  readonly id: string;
  readonly storeId: string;
  readonly connector: ConnectorCode;
  readonly shopUrl: string;
  readonly shopName: string;
  readonly credentials: Readonly<Record<string, string>>;
  readonly now: Date;
}

/** Credentials are sealed on save and opened only by `credentials()`, for connector calls. */
export interface ConnectionRepository {
  list(storeId: string): Promise<ConnectionRecord[]>;
  find(storeId: string, id: string): Promise<ConnectionRecord | null>;
  /** Unscoped, for signed shop webhooks only: the signature, not a login, proves the caller. */
  findForWebhook(id: string): Promise<ConnectionRecord | null>;
  /** Inserts, or replaces the credentials of the same shop and marks it connected again. */
  save(connection: NewConnection): Promise<ConnectionRecord>;
  remove(storeId: string, id: string): Promise<boolean>;
  credentials(connection: ConnectionRecord): Promise<Record<string, string>>;
}
