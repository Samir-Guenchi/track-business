import type { StoreConnector } from './store-connector.port.js';

export class UnknownConnectorError extends Error {
  readonly code = 'connector.unknown';

  constructor(connectorCode: string) {
    super(`No connector registered for "${connectorCode}"`);
  }
}

/** Looks connectors up by code so callers never switch on platform names. */
export class ConnectorRegistry {
  private readonly connectors: ReadonlyMap<string, StoreConnector>;

  constructor(connectors: readonly StoreConnector[]) {
    this.connectors = new Map(connectors.map((connector) => [connector.code, connector]));
  }

  get(code: string): StoreConnector {
    const connector = this.connectors.get(code);
    if (!connector) throw new UnknownConnectorError(code);
    return connector;
  }

  list(): StoreConnector[] {
    return [...this.connectors.values()];
  }
}
