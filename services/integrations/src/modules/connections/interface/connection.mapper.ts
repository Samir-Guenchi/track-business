import type { ConnectorInfo, Integration } from '@trackecom/contracts';
import type { StoreConnector } from '@trackecom/connectors';
import type { ConnectionRecord } from '../application/ports/connection.repository.js';

export const toIntegration = (connection: ConnectionRecord): Integration => ({
  id: connection.id,
  connector: connection.connector,
  shopUrl: connection.shopUrl,
  shopName: connection.shopName,
  status: connection.status,
  lastSyncAt: connection.lastSyncAt?.toISOString() ?? null,
  ordersImported: connection.ordersImported,
  lastError: connection.lastError,
});

export const toConnectorInfo = (connector: StoreConnector): ConnectorInfo => ({
  code: connector.code,
  name: connector.name,
  credentialFields: [...connector.credentialFields],
  webhooks: connector.capabilities.webhooks,
  fulfilment: connector.capabilities.fulfilment,
});
