import { ConnectorError, connectorErrorKind } from '../connector.errors.js';
import type { ConnectorContext, ExternalOrder, OrderPage, ShopInfo } from '../connector.types.js';
import type { FetchLike } from '../shopify/shopify-client.js';
import type { StoreConnector } from '../store-connector.port.js';
import type { AccessTokens } from './service-account.js';
import { columnsOf } from './sheet-columns.js';
import { rowsToOrders } from './sheet-rows.js';
import { parseSheetUrl, SHEETS_CODE } from './sheet-url.js';

const API = 'https://sheets.googleapis.com/v4/spreadsheets';
/** Order sheets stay well under this; past it, sellers should archive old rows. */
const MAX_ROWS = 5000;

interface Metadata {
  properties: { title: string };
  sheets: { properties: { sheetId: number; title: string } }[];
}

const notSupported = (what: string) =>
  new ConnectorError('not_supported', `Google Sheets has no ${what}`, { connector: SHEETS_CODE });

/**
 * Orders typed or collected in a Google Sheet (#26). The seller shares the sheet with
 * TrackEcom's service account and pastes its link; the header row tells which column is which
 * (French, English or Arabic). Every poll reads the sheet and the integrations ledger keeps only
 * rows it has not seen, so a row becomes an order once.
 */
export class GoogleSheetsConnector implements StoreConnector {
  readonly code = SHEETS_CODE;
  readonly name = 'Google Sheets';
  readonly credentialFields = [];
  readonly capabilities = { webhooks: false, fulfilment: false };
  private readonly fetchImpl: FetchLike;

  constructor(private readonly options: { tokens: AccessTokens; fetch?: FetchLike }) {
    this.fetchImpl = options.fetch ?? ((url, init) => globalThis.fetch(url, init));
  }

  async validate(ctx: ConnectorContext): Promise<ShopInfo> {
    const { title } = await this.sheet(ctx);
    await this.rows(ctx);
    return { name: title, currency: 'DZD' };
  }

  async listOrders(ctx: ConnectorContext): Promise<OrderPage> {
    return { orders: await this.rows(ctx), nextCursor: null };
  }

  async parseWebhook(): Promise<ExternalOrder[]> {
    throw notSupported('webhooks');
  }

  async pushFulfilment(): Promise<void> {
    throw notSupported('fulfilment');
  }

  private async rows(ctx: ConnectorContext): Promise<ExternalOrder[]> {
    const { spreadsheetId } = parseSheetUrl(ctx.shopUrl);
    const { tab } = await this.sheet(ctx);
    const range = encodeURIComponent(`'${tab.replace(/'/g, "''")}'!A1:Z${MAX_ROWS}`);
    const body = await this.get<{ values?: string[][] }>(`${spreadsheetId}/values/${range}`);
    const [header = [], ...rows] = body.values ?? [];
    return rowsToOrders(rows, columnsOf(header));
  }

  /** The spreadsheet's title and the tab the link points at (the first tab when none). */
  private async sheet(ctx: ConnectorContext): Promise<{ title: string; tab: string }> {
    const { spreadsheetId, gid } = parseSheetUrl(ctx.shopUrl);
    const fields = 'properties.title,sheets.properties(sheetId,title)';
    const meta = await this.get<Metadata>(`${spreadsheetId}?fields=${encodeURIComponent(fields)}`);
    const tabs = meta.sheets.map((sheet) => sheet.properties);
    const tab = gid === null ? tabs[0] : tabs.find((each) => each.sheetId === gid);
    if (!tab) throw new ConnectorError('not_found', 'No such tab', { connector: SHEETS_CODE });
    return { title: meta.properties.title, tab: tab.title };
  }

  private async get<T>(path: string): Promise<T> {
    const token = await this.options.tokens();
    const response = await this.fetchImpl(`${API}/${path}`, {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
    }).catch(() => {
      throw new ConnectorError('unavailable', 'Google did not answer', { connector: SHEETS_CODE });
    });
    if (!response.ok) {
      const status = response.status;
      throw new ConnectorError(connectorErrorKind(status), `Google Sheets answered ${status}`, {
        connector: SHEETS_CODE,
        status,
      });
    }
    return (await response.json()) as T;
  }
}
