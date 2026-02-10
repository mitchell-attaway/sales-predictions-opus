/**
 * Parser for the current-month tab CSV.
 *
 * The CSV contains:
 *  1. A "1st of MONTH" header row
 *  2. Pipeline column headers
 *  3. Pipeline data rows
 *  4. Summary rows / blank rows
 *  5. Possibly a "15th of MONTH" section
 *  6. An "End of MONTH | 30 Actuals" section (or similar)
 *  7. Actuals data rows
 */

import Papa from 'papaparse';
import type { Prospect, Actual, MonthlyData } from '@/types';
import {
  buildPipelineColumnIndex,
  buildActualsColumnIndex,
  getString,
  getCurrency,
  getPercent,
  buildRawMap,
} from '@/lib/normalize';

// ---------------------------------------------------------------------------
// Section detection
// ---------------------------------------------------------------------------

/** Check if a row looks like a header row (has multiple non-empty text cells). */
function looksLikeHeader(row: string[]): boolean {
  const nonEmpty = row.filter((c) => c.trim() !== '');
  return nonEmpty.length >= 3;
}

/** Check if a row is blank or near-blank. */
function isBlankRow(row: string[]): boolean {
  return row.every((c) => c.trim() === '');
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

export function parseMonthlyCsv(csvText: string): MonthlyData {
  const warnings: string[] = [];

  const parsed = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: false,
  });

  const allRows = parsed.data;
  if (!allRows || allRows.length < 3) {
    return { pipeline: [], actuals: [], actualsDetected: false, warnings: ['CSV has too few rows'] };
  }

  // --- Find sections ---
  // We look for "1st of MONTH" marker, then pipeline headers, then "End of MONTH" / "Actuals" marker.

  let pipelineHeaderIdx = -1;
  let actualsMarkerIdx = -1;
  let actualsHeaderIdx = -1;

  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i];
    const joined = row.join(' ').toLowerCase();

    // Find the "1st of MONTH" marker — pipeline headers are the next non-blank row
    // Only match "1st of month" specifically (not "15th" or other variants)
    if (
      pipelineHeaderIdx === -1 &&
      (joined.includes('1st of month') ||
        (joined.includes('30/60 day close prediction') && !joined.includes('15th')))
    ) {
      // Next non-blank row with enough columns is the header
      for (let j = i + 1; j < Math.min(i + 5, allRows.length); j++) {
        if (looksLikeHeader(allRows[j])) {
          pipelineHeaderIdx = j;
          break;
        }
      }
    }

    // Find the "End of MONTH" / "Actuals" marker
    if (
      (joined.includes('end of month') || joined.includes('actuals')) &&
      !joined.includes('1st of month') &&
      actualsMarkerIdx === -1
    ) {
      actualsMarkerIdx = i;
    }
  }

  // If we didn't find the 1st-of-month marker, try the first row with many headers
  if (pipelineHeaderIdx === -1) {
    for (let i = 0; i < Math.min(10, allRows.length); i++) {
      if (looksLikeHeader(allRows[i]) && allRows[i].some((c) => c.toLowerCase().includes('deal'))) {
        pipelineHeaderIdx = i;
        break;
      }
    }
  }

  if (pipelineHeaderIdx === -1) {
    return { pipeline: [], actuals: [], actualsDetected: false, warnings: ['Could not find pipeline header row'] };
  }

  const pipelineHeaders = allRows[pipelineHeaderIdx];
  const pipelineCols = buildPipelineColumnIndex(pipelineHeaders);

  // Determine where pipeline data ends
  // It ends when we hit the actuals marker, a "15th of MONTH" marker, or summary rows
  const pipelineEndIdx = findPipelineEnd(allRows, pipelineHeaderIdx, actualsMarkerIdx);

  // --- Parse pipeline ---
  const pipeline: Prospect[] = [];
  for (let i = pipelineHeaderIdx + 1; i < pipelineEndIdx; i++) {
    const row = allRows[i];
    if (isBlankRow(row)) continue;

    // Skip summary rows (contain "Number of Close", "Dollar", "Prediction", etc.)
    const joined = row.join(' ').toLowerCase();
    if (
      joined.includes('number of close') ||
      joined.includes('prediction') ||
      joined.includes('dollar:') ||
      joined.includes('summary')
    ) {
      continue;
    }

    // Skip rows that don't look like data (no deal name)
    const name = getString(row, pipelineCols, 'prospectName');
    const dv = getString(row, pipelineCols, 'dealValue');
    if (!name && !dv) continue;

    const prospect: Prospect = {
      prospectName: name,
      dealValue: getCurrency(row, pipelineCols, 'dealValue'),
      oneTime: getCurrency(row, pipelineCols, 'oneTime'),
      onboarding: getCurrency(row, pipelineCols, 'onboarding'),
      ongoing: getCurrency(row, pipelineCols, 'ongoing'),
      owner: getString(row, pipelineCols, 'owner'),
      marketingDirector: getString(row, pipelineCols, 'marketingDirector'),
      pipeline: getString(row, pipelineCols, 'pipeline'),
      state: getString(row, pipelineCols, 'state'),
      stage: getString(row, pipelineCols, 'stage'),
      expWindow: getString(row, pipelineCols, 'expWindow'),
      expectedCloseMonth: getString(row, pipelineCols, 'expectedCloseMonth'),
      expectedStartDate: getString(row, pipelineCols, 'expectedStartDate'),
      chanceOfClose: getPercent(row, pipelineCols, 'chanceOfClose'),
      chanceNext30: getPercent(row, pipelineCols, 'chanceNext30'),
      chanceNext60: getPercent(row, pipelineCols, 'chanceNext60'),
      closeStatus: getString(row, pipelineCols, 'closeStatus'),
      _raw: buildRawMap(row, pipelineHeaders),
    };

    // Only include rows with a name or non-zero deal value
    if (prospect.prospectName || prospect.dealValue > 0) {
      pipeline.push(prospect);
    }
  }

  // --- Parse actuals ---
  const actuals: Actual[] = [];
  let actualsDetected = false;

  if (actualsMarkerIdx !== -1) {
    actualsDetected = true;

    // Find actuals header row after the marker
    for (let j = actualsMarkerIdx; j < Math.min(actualsMarkerIdx + 5, allRows.length); j++) {
      const row = allRows[j];
      if (looksLikeHeader(row) && row.some((c) => {
        const l = c.toLowerCase().trim();
        return l.includes('deal') || l.includes('partner');
      })) {
        actualsHeaderIdx = j;
        break;
      }
    }

    if (actualsHeaderIdx === -1) {
      // Try using the same headers as pipeline, data starts right after marker
      actualsHeaderIdx = actualsMarkerIdx;
    }

    const actualsHeaders = allRows[actualsHeaderIdx];
    const actualsCols = buildActualsColumnIndex(actualsHeaders);

    // If actuals column mapping is empty, fall back to pipeline column mapping
    const hasActualsCols = Object.keys(actualsCols).length > 0;
    const effectiveHeaders = hasActualsCols ? actualsHeaders : pipelineHeaders;
    const effectiveCols = hasActualsCols ? actualsCols : buildActualsColumnIndex(pipelineHeaders);

    for (let i = actualsHeaderIdx + 1; i < allRows.length; i++) {
      const row = allRows[i];
      if (isBlankRow(row)) continue;

      const joined = row.join(' ').toLowerCase();
      if (
        joined.includes('number of close') ||
        joined.includes('prediction') ||
        joined.includes('updated') ||
        joined.includes('summary') ||
        joined.includes('dollar:')
      ) {
        continue;
      }

      // Stop if we hit another section marker
      if (joined.includes('15th of month') || joined.includes('1st of month')) {
        break;
      }

      const name = getString(row, effectiveCols, 'partnerName');
      const dv = getString(row, effectiveCols, 'dealValue');
      if (!name && !dv) continue;

      const actual: Actual = {
        partnerName: name,
        dealValue: getCurrency(row, effectiveCols, 'dealValue'),
        salesperson: getString(row, effectiveCols, 'salesperson'),
        state: getString(row, effectiveCols, 'state'),
        pipeline: getString(row, effectiveCols, 'pipeline'),
        stage: getString(row, effectiveCols, 'stage'),
        closeStatus: getString(row, effectiveCols, 'closeStatus'),
        _raw: buildRawMap(row, effectiveHeaders),
      };

      if (actual.partnerName || actual.dealValue > 0) {
        actuals.push(actual);
      }
    }
  } else {
    warnings.push('Actuals section not detected in this month\'s data.');
  }

  return { pipeline, actuals, actualsDetected, warnings };
}

/** Find the end index of pipeline data rows. */
function findPipelineEnd(
  allRows: string[][],
  headerIdx: number,
  actualsMarkerIdx: number
): number {
  // Pipeline ends at whichever comes first:
  //  - actualsMarkerIdx (if found)
  //  - a "15th of MONTH" marker
  //  - a "30 Day Prediction Summary" or "Number of Close" summary block
  //  - end of data

  const end = actualsMarkerIdx !== -1 ? actualsMarkerIdx : allRows.length;

  for (let i = headerIdx + 1; i < end; i++) {
    const joined = allRows[i].join(' ').toLowerCase();
    if (joined.includes('15th of month') || joined.includes('end of month')) {
      return i;
    }
    if (joined.includes('day prediction') && joined.includes('summary')) {
      return i;
    }
    if (joined.includes('number of close') && joined.includes(':')) {
      return i;
    }
  }

  return end;
}
