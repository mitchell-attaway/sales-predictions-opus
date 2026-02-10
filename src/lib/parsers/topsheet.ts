/**
 * Parser for the "2026" yearly tab CSV.
 *
 * The tab contains multiple sections with months across columns:
 *  - Projected Average New Partner Value
 *  - Actual New Partner Value
 *  - Model Projected Closed Revenue (Monthly + Rolling)
 *  - Actual Closed Revenue (Monthly + Rolling)
 *  - Model Projected New Partners (Monthly + Rolling)
 *  - Actual Closed Partners (Monthly + Rolling)
 *  - Projected vs Actual (revenue & partners)
 *  - Accuracy %
 */

import Papa from 'papaparse';
import { parseCurrency, parsePercent } from '@/lib/normalize';
import { TOP_SHEET_MARKERS, MONTH_SHORT_NAMES } from '@/config/columns';
import type { TopSheetData, TopSheetMonth } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findSectionRow(rows: string[][], marker: string): number {
  const m = marker.toLowerCase();
  for (let i = 0; i < rows.length; i++) {
    const joined = rows[i].join(' ').toLowerCase();
    if (joined.includes(m)) return i;
  }
  return -1;
}

/**
 * Given a section start row, find the month header row and data rows.
 * The month header row contains "Jan", "Feb", ... "Dec" (or "Month").
 * Data rows follow immediately after.
 */
function findMonthHeaderAndData(
  rows: string[][],
  sectionStart: number
): { monthRow: string[]; dataRows: string[][] } | null {
  for (let i = sectionStart; i < Math.min(sectionStart + 4, rows.length); i++) {
    const row = rows[i];
    const joined = row.join(',').toLowerCase();
    if (joined.includes('jan') || joined.includes('month')) {
      // Collect data rows until blank or next section
      const dataRows: string[][] = [];
      for (let j = i + 1; j < Math.min(i + 5, rows.length); j++) {
        const nonEmpty = rows[j].filter((c) => c.trim() !== '');
        if (nonEmpty.length < 2) break;
        // Skip if it looks like a new section header
        const dJoined = rows[j].join(' ').toLowerCase();
        if (
          dJoined.includes('projected') ||
          dJoined.includes('actual') ||
          dJoined.includes('accuracy')
        )
          break;
        dataRows.push(rows[j]);
      }
      return { monthRow: row, dataRows };
    }
  }
  return null;
}

/**
 * Extract monthly values from a row, aligned to month columns.
 * The month header row tells us which column index corresponds to Jan, Feb, etc.
 */
function extractMonthValues(
  monthRow: string[],
  dataRow: string[]
): number[] {
  const values: number[] = new Array(12).fill(0);

  for (let i = 0; i < monthRow.length; i++) {
    const header = monthRow[i].trim();
    const monthIdx = MONTH_SHORT_NAMES.findIndex(
      (m) => m.toLowerCase() === header.toLowerCase()
    );
    if (monthIdx !== -1 && i < dataRow.length) {
      values[monthIdx] = parseCurrency(dataRow[i]);
    }
  }

  return values;
}

/**
 * Extract a single value near a section marker.
 * Column-aware: finds which column the marker is in, then looks
 * in the same column in subsequent rows for the numeric value.
 * This handles layouts where multiple markers share a row.
 */
function extractSingleValue(rows: string[][], marker: string): number {
  const m = marker.toLowerCase();

  for (let i = 0; i < rows.length; i++) {
    for (let c = 0; c < rows[i].length; c++) {
      const cell = rows[i][c].trim().toLowerCase();
      if (!cell.includes(m)) continue;

      // Found the marker at (i, c). Look in the same column below.
      for (let r = i + 1; r < Math.min(i + 3, rows.length); r++) {
        if (c >= rows[r].length) continue;
        const trimmed = rows[r][c].trim();
        if (!trimmed) continue;
        const val = parseCurrency(trimmed);
        if (val > 0) return val;
        const pct = parsePercent(trimmed);
        if (pct > 0) return pct;
      }
      return 0;
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

export function parseTopSheetCsv(csvText: string): TopSheetData {
  const warnings: string[] = [];

  const parsed = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: false,
  });

  const rows = parsed.data;

  // --- Extract scalar values ---
  const projectedAvgPartnerValue = extractSingleValue(
    rows,
    TOP_SHEET_MARKERS.projectedAvgPartnerValue
  );
  const actualAvgPartnerValue = extractSingleValue(
    rows,
    TOP_SHEET_MARKERS.actualAvgPartnerValue
  );
  const projectedAvgPartnerCount = extractSingleValue(
    rows,
    TOP_SHEET_MARKERS.projectedAvgPartnerCount
  );
  const actualAvgPartnerCount = extractSingleValue(
    rows,
    TOP_SHEET_MARKERS.actualAvgPartnerCount
  );

  // --- Extract monthly revenue data ---
  let modeledRevenueMonthly = new Array(12).fill(0);
  let modeledRevenueRolling = new Array(12).fill(0);
  let actualRevenueMonthly = new Array(12).fill(0);
  let actualRevenueRolling = new Array(12).fill(0);
  let revenueVariance = new Array(12).fill(0);

  const modeledRevSection = findSectionRow(rows, TOP_SHEET_MARKERS.modeledRevenue);
  if (modeledRevSection !== -1) {
    const result = findMonthHeaderAndData(rows, modeledRevSection);
    if (result && result.dataRows.length >= 1) {
      modeledRevenueMonthly = extractMonthValues(result.monthRow, result.dataRows[0]);
      if (result.dataRows.length >= 2) {
        modeledRevenueRolling = extractMonthValues(result.monthRow, result.dataRows[1]);
      }
    }
  } else {
    warnings.push('Model Projected Closed Revenue section not found');
  }

  const actualRevSection = findSectionRow(rows, TOP_SHEET_MARKERS.actualRevenue);
  if (actualRevSection !== -1) {
    const result = findMonthHeaderAndData(rows, actualRevSection);
    if (result && result.dataRows.length >= 1) {
      actualRevenueMonthly = extractMonthValues(result.monthRow, result.dataRows[0]);
      if (result.dataRows.length >= 2) {
        actualRevenueRolling = extractMonthValues(result.monthRow, result.dataRows[1]);
      }
    }
  } else {
    warnings.push('Actual Closed Revenue section not found');
  }

  // Revenue variance section
  const revVarianceSection = findSectionRow(rows, TOP_SHEET_MARKERS.revenueVariance);
  if (revVarianceSection !== -1) {
    const result = findMonthHeaderAndData(rows, revVarianceSection);
    if (result && result.dataRows.length >= 1) {
      revenueVariance = extractMonthValues(result.monthRow, result.dataRows[0]);
    }
  }

  // --- Extract monthly partners data ---
  let modeledPartnersMonthly = new Array(12).fill(0);
  let modeledPartnersRolling = new Array(12).fill(0);
  let actualPartnersMonthly = new Array(12).fill(0);
  let actualPartnersRolling = new Array(12).fill(0);
  let partnersVariance = new Array(12).fill(0);

  const modeledPartSection = findSectionRow(rows, TOP_SHEET_MARKERS.modeledPartners);
  if (modeledPartSection !== -1) {
    const result = findMonthHeaderAndData(rows, modeledPartSection);
    if (result && result.dataRows.length >= 1) {
      modeledPartnersMonthly = extractMonthValues(result.monthRow, result.dataRows[0]);
      if (result.dataRows.length >= 2) {
        modeledPartnersRolling = extractMonthValues(result.monthRow, result.dataRows[1]);
      }
    }
  } else {
    warnings.push('Model Projected New Partners section not found');
  }

  const actualPartSection = findSectionRow(rows, TOP_SHEET_MARKERS.actualPartners);
  if (actualPartSection !== -1) {
    const result = findMonthHeaderAndData(rows, actualPartSection);
    if (result && result.dataRows.length >= 1) {
      actualPartnersMonthly = extractMonthValues(result.monthRow, result.dataRows[0]);
      if (result.dataRows.length >= 2) {
        actualPartnersRolling = extractMonthValues(result.monthRow, result.dataRows[1]);
      }
    }
  } else {
    warnings.push('Actual Closed Partners section not found');
  }

  // Partners variance – find the SECOND "Projected vs Actual" section (first is revenue)
  // We search after the partners section
  const partnerSearchStart = Math.max(modeledPartSection, actualPartSection);
  if (partnerSearchStart > 0) {
    for (let i = partnerSearchStart; i < rows.length; i++) {
      const joined = rows[i].join(' ').toLowerCase();
      if (joined.includes('projected vs actual')) {
        const result = findMonthHeaderAndData(rows, i);
        if (result && result.dataRows.length >= 1) {
          partnersVariance = extractMonthValues(result.monthRow, result.dataRows[0]);
        }
        break;
      }
    }
  }

  // --- Extract accuracy (column-aware) ---
  // Both accuracy labels may share a row, so find the column of each marker
  // and look in the same column in the next row for the percent value.
  let revenueAccuracy = 0;
  let partnersAccuracy = 0;

  for (let i = Math.max(0, rows.length - 10); i < rows.length; i++) {
    const joined = rows[i].join(' ').toLowerCase();
    if (!joined.includes('accuracy')) continue;

    for (let c = 0; c < rows[i].length; c++) {
      const cell = rows[i][c].trim().toLowerCase();
      if (!cell.includes('accuracy')) continue;

      const isPartners = cell.includes('close number');
      const isRevenue = cell.includes('revenue');

      if (!isPartners && !isRevenue) continue;

      // Look in the same column in the next row for the percent
      if (i + 1 < rows.length && c < rows[i + 1].length) {
        const pct = parsePercent(rows[i + 1][c].trim());
        if (pct > 0) {
          if (isPartners) partnersAccuracy = pct;
          if (isRevenue) revenueAccuracy = pct;
        }
      }
    }
    break; // Only process the first accuracy row
  }

  // --- Build month array ---
  const months: TopSheetMonth[] = MONTH_SHORT_NAMES.map((name, idx) => ({
    month: name,
    monthIndex: idx,
    modeledRevenue: modeledRevenueMonthly[idx],
    actualRevenue: actualRevenueMonthly[idx],
    revenueVariance: revenueVariance[idx],
    modeledRevenueRolling: modeledRevenueRolling[idx],
    actualRevenueRolling: actualRevenueRolling[idx],
    modeledPartners: modeledPartnersMonthly[idx],
    actualPartners: actualPartnersMonthly[idx],
    partnersVariance: partnersVariance[idx],
    modeledPartnersRolling: modeledPartnersRolling[idx],
    actualPartnersRolling: actualPartnersRolling[idx],
  }));

  return {
    months,
    projectedAvgPartnerValue,
    actualAvgPartnerValue,
    projectedAvgPartnerCount,
    actualAvgPartnerCount,
    revenueAccuracy,
    partnersAccuracy,
    warnings,
  };
}
