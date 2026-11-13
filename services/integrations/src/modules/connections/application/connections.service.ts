import { Inject, Injectable } from '@nestjs/common';
import type { ConnectShopRequest } from '@trackecom/contracts';
import {
  ConnectorError,
  type ConnectorContext,
  ConnectorRegistry,
  type StoreConnector,
  UnknownConnectorError,
} from '@trackecom/connectors';
import {
  ConnectionNotFoundError,
  ConnectorNotSupportedError,
  InvalidShopCredentialsError,
} from '../domain/connection.errors.js';
import { pickCredentials } from '../domain/credentials.js';
import {
  CONNECTION_REPOSITORY,
  type ConnectionRecord,
  type ConnectionRepository,
} from './ports/connection.repository.js';

/** Time and ids, injected so tests can pin them. */
export interface Runtime {
  readonly now: () => Date;
  readonly newId: () => string;
}
export const CONNECTIONS_RUNTIME = Symbol('ConnectionsRuntime');

/** Connects a store to its shops. Credentials are checked with the shop before they are saved. */
@Injectable()
export class ConnectionsService {
  constructor(
    @Inject(CONNECTION_REPOSITORY) private readonly connections: ConnectionRepository,
    private readonly registry: ConnectorRegistry,
    @Inject(CONNECTIONS_RUNTIME) private readonly runtime: Runtime,
  ) {}

  connectors(): StoreConnector[] {
    return this.registry.list();
  }

  list(storeId: string): Promise<ConnectionRecord[]> {
    return this.connections.list(storeId);
  }

  async connect(storeId: string, request: ConnectShopRequest): Promise<ConnectionRecord> {
    const connector = this.connector(request.connector);
    const fields = connector.credentialFields;
    const { credentials, missing } = pickCredentials(fields, request.credentials);
    if (missing.length > 0) {
      throw new InvalidShopCredentialsError(`Missing: ${missing.join(', ')}`);
    }
    const ctx = { storeId, shopUrl: request.shopUrl, credentials };
    const shop = await this.validate(connector, ctx);
    return this.connections.save({
      id: this.runtime.newId(),
      storeId,
      connector: request.connector,
      shopUrl: request.shopUrl,
      shopName: shop.name,
      credentials,
      now: this.runtime.now(),
    });
  }

  async disconnect(storeId: string, id: string): Promise<void> {
    if (!(await this.connections.remove(storeId, id))) throw new ConnectionNotFoundError();
  }

  /** Connector plus decrypted context, for workers that call the shop for this connection. */
  async open(connection: ConnectionRecord) {
    const connector = this.connector(connection.connector);
    const credentials = await this.connections.credentials(connection);
    const ctx: ConnectorContext = {
      storeId: connection.storeId,
      shopUrl: connection.shopUrl,
      credentials,
    };
    return { connector, ctx };
  }

  private async validate(connector: StoreConnector, ctx: ConnectorContext) {
    try {
      return await connector.validate(ctx);
    } catch (error) {
      if (!(error instanceof ConnectorError)) throw error;
      throw new InvalidShopCredentialsError(`${connector.name} refused: ${error.kind}`);
    }
  }

  private connector(code: string): StoreConnector {
    try {
      return this.registry.get(code);
    } catch (error) {
      if (error instanceof UnknownConnectorError) throw new ConnectorNotSupportedError(code);
      throw error;
    }
  }
}
