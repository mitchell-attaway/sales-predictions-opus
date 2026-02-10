/**
 * Normalisation helpers for CSV data.
 *
 * Handles: currency strings → number, percentage strings → 0-1 decimal,
 * header synonym matching, etc.
 */

import {
  PIPELINE_COLUMN_MAP,
  PIPELINE_SYNONYMS,
  ACTUALS_COLUMN_MAP,
  ACTUALS_SYNONYMS,
} from '@/config/columns';

// ---------------------------------------------------------------------------
// Value normalisers
// ---------------------------------------------------------------------------

/** Parse a currency string like "$225,000.00" or "225000" to a number. */
export function parseCurrency(raw: string | undefined | null): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[$,\s]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/**
 * Parse a percentage string to a 0-1 decimal.
 * Handles: "35%", "0.35", "35", ".35"
 */
export function parsePercent(raw: string | undefined | null): number {
  if (!raw) return 0;
  const trimmed = raw.trim().replace(/\s/g, '');
  if (trimmed === '') return 0;

  // If it ends with %, strip and divide by 100
  if (trimmed.endsWith('%')) {
    const n = parseFloat(trimmed.replace('%', ''));
    return isNaN(n) ? 0 : n / 100;
  }

  const n = parseFloat(trimmed);
  if (isNaN(n)) return 0;

  // Heuristic: if > 1, treat as percentage (e.g., "35" → 0.35)
  if (n > 1) return n / 100;
  return n;
}

// ---------------------------------------------------------------------------
// Column mapping
// ---------------------------------------------------------------------------

/**
 * Given real CSV headers, build a map from normalised field name → column index.
 * Uses the explicit column map first, then falls back to synonym matching.
 */
export function buildColumnIndex(
  headers: string[],
  columnMap: Record<string, string>,
  synonyms: Record<string, string>
): Record<string, number> {
  const result: Record<string, number> = {};

  // Pass 1: exact match from columnMap
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim();
    if (columnMap[h]) {
      result[columnMap[h]] = i;
    }
  }

  // Pass 2: synonym fallback for any fields not yet matched
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim().toLowerCase();
    if (synonyms[h] && result[synonyms[h]] === undefined) {
      result[synonyms[h]] = i;
    }
  }

  return result;
}

/** Convenience: build pipeline column index. */
export function buildPipelineColumnIndex(headers: string[]) {
  return buildColumnIndex(headers, PIPELINE_COLUMN_MAP, PIPELINE_SYNONYMS);
}

/** Convenience: build actuals column index. */
export function buildActualsColumnIndex(headers: string[]) {
  return buildColumnIndex(headers, ACTUALS_COLUMN_MAP, ACTUALS_SYNONYMS);
}

/**
 * Get a string value from a row using the column index.
 * Returns empty string if index not found.
 */
export function getString(
  row: string[],
  colIndex: Record<string, number>,
  field: string
): string {
  const idx = colIndex[field];
  if (idx === undefined || idx >= row.length) return '';
  return (row[idx] ?? '').trim();
}

/**
 * Get a currency value from a row.
 */
export function getCurrency(
  row: string[],
  colIndex: Record<string, number>,
  field: string
): number {
  return parseCurrency(getString(row, colIndex, field));
}

/**
 * Get a percent value (normalised to 0-1) from a row.
 */
export function getPercent(
  row: string[],
  colIndex: Record<string, number>,
  field: string
): number {
  return parsePercent(getString(row, colIndex, field));
}

/**
 * Build a raw key-value map from a row and its headers.
 */
export function buildRawMap(
  row: string[],
  headers: string[]
): Record<string, string> {
  const raw: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    const key = headers[i]?.trim();
    if (key) raw[key] = (row[i] ?? '').trim();
  }
  return raw;
}
