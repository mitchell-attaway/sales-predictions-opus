/**
 * Google Sheets configuration.
 *
 * The "sales predictions" workbook is web-published. Each tab (worksheet)
 * has a unique `gid`. We build per-tab CSV export URLs from a single
 * SHEET_ID + the tab's gid.
 */

const SHEET_ID =
  process.env.SALES_PREDICTIONS_SHEET_ID ??
  '2PACX-1vTmXpub-XcClEL87mq-nr1mpCCshRrqj1Xcu_f4eJlPlYQHRiVOW_yF67C3F06vANp97APtcK_5YrRw';

const TOP_SHEET_GID = process.env.TOP_SHEET_GID ?? '867529212';

/** Build a CSV export URL for a given tab gid. */
export function buildCsvUrl(gid: string): string {
  return `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=${gid}&single=true&output=csv`;
}

/** URL for the Top Sheet tab */
export function getTopSheetUrl(): string {
  return buildCsvUrl(TOP_SHEET_GID);
}

/** Whether to use local mock data instead of live sheets */
export function isMockMode(): boolean {
  return process.env.USE_MOCK_DATA === 'true';
}

/** Cache revalidation interval in seconds */
export function getRevalidateSeconds(): number {
  return parseInt(process.env.REVALIDATE_SECONDS ?? '300', 10);
}
