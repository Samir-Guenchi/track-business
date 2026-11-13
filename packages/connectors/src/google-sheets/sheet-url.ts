import { ConnectorError } from '../connector.errors.js';

export const SHEETS_CODE = 'google_sheets';

export interface SheetAddress {
  readonly spreadsheetId: string;
  /** The tab in the link (`#gid=`); null means the first tab. */
  readonly gid: number | null;
}

const ID = /\/spreadsheets\/d\/([A-Za-z0-9_-]{20,100})/;
const GID = /[#&?]gid=(\d+)/;

/** Reads the link a seller copies from the browser: `https://docs.google.com/spreadsheets/d/<id>/edit#gid=<tab>`. */
export function parseSheetUrl(shopUrl: string): SheetAddress {
  const url = shopUrl.trim();
  const id = ID.exec(url)?.[1];
  if (!url.startsWith('https://docs.google.com/') || !id) {
    throw new ConnectorError('validation', 'Not a Google Sheets link', { connector: SHEETS_CODE });
  }
  const gid = GID.exec(url)?.[1];
  return { spreadsheetId: id, gid: gid === undefined ? null : Number(gid) };
}
