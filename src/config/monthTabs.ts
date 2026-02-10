/**
 * Mapping from YYYY-MM to the Google Sheet tab gid.
 *
 * The "sales predictions" sheet has one tab per month named like
 * "FEB 1 (26)". Each tab's gid was extracted from the published HTML.
 *
 * To add a new month: append the entry here with the gid from the
 * sheet's pubhtml source (look for `gid=XXXXX` in tab links).
 */

import { buildCsvUrl } from './sheet';

export const MONTH_GID_MAP: Record<string, string> = {
  '2025-12': '1857283203', // DEC 1
  '2026-01': '1140427137', // JAN 1 (26)
  '2026-02': '1621305080', // FEB 1 (26)
  '2026-03': '2030048186', // MAR 1 (26)
  '2026-04': '1287199759', // APR 1 (26)
  '2026-05': '1615675891', // MAY 1 (26)
  '2026-06': '600545944',  // JUN 1 (26)
  '2026-07': '251192486',  // JUL 1 (26)
  '2026-08': '1238221467', // AUG 1 (26)
  '2026-09': '1151167556', // SEP 1 (26)
  '2026-10': '1351111762', // OCT 1 (26)
  '2026-11': '1877149819', // NOV 1 (26)
  '2026-12': '1348041281', // DEC 1 (26)
};

/** All available months (sorted) */
export const AVAILABLE_MONTHS = Object.keys(MONTH_GID_MAP).sort();

/** Month labels for the dropdown */
export const MONTH_LABELS: Record<string, string> = {
  '2025-12': 'December 2025',
  '2026-01': 'January 2026',
  '2026-02': 'February 2026',
  '2026-03': 'March 2026',
  '2026-04': 'April 2026',
  '2026-05': 'May 2026',
  '2026-06': 'June 2026',
  '2026-07': 'July 2026',
  '2026-08': 'August 2026',
  '2026-09': 'September 2026',
  '2026-10': 'October 2026',
  '2026-11': 'November 2026',
  '2026-12': 'December 2026',
};

/** Get the CSV URL for a given month (YYYY-MM). Returns null if unknown. */
export function getMonthCsvUrl(month: string): string | null {
  const gid = MONTH_GID_MAP[month];
  return gid ? buildCsvUrl(gid) : null;
}

/** Current month key in YYYY-MM format (America/New_York). */
export function getCurrentMonth(): string {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
