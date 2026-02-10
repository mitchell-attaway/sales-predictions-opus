/**
 * Config-driven column mapping.
 *
 * Maps real spreadsheet header names → normalised internal field names.
 * If the real header isn't found, we fall back to a case-insensitive
 * synonym search (see `findColumn` in normalize.ts).
 */

// ---------------------------------------------------------------------------
// Pipeline columns (current month tab, top section)
// ---------------------------------------------------------------------------
export const PIPELINE_COLUMN_MAP: Record<string, string> = {
  Deal: 'prospectName',
  'Deal Value': 'dealValue',
  'One Time': 'oneTime',
  Onboarding: 'onboarding',
  Ongoing: 'ongoing',
  Owner: 'owner',
  MD: 'marketingDirector',
  Pipeline: 'pipeline',
  State: 'state',
  Stage: 'stage',
  'Exp 30/60': 'expWindow',
  'Exp Close Date': 'expectedCloseMonth',
  'Exp Start Date': 'expectedStartDate',
  'Chance of Close': 'chanceOfClose',
  'Chance 30-day closing / 60 Days': 'chanceLabel',
  'Close?': 'closeStatus',
  'Chance of Close (30)': 'chanceNext30',
  'Chance of Close (60)': 'chanceNext60',
};

/** Synonyms for fallback matching (lowercase) → normalised field */
export const PIPELINE_SYNONYMS: Record<string, string> = {
  deal: 'prospectName',
  'deal name': 'prospectName',
  prospect: 'prospectName',
  partner: 'prospectName',
  'deal value': 'dealValue',
  value: 'dealValue',
  amount: 'dealValue',
  owner: 'owner',
  salesperson: 'owner',
  'sales person': 'owner',
  'sales rep': 'owner',
  md: 'marketingDirector',
  'marketing director': 'marketingDirector',
  pipeline: 'pipeline',
  state: 'state',
  stage: 'stage',
  'chance of close': 'chanceOfClose',
  'close probability': 'chanceOfClose',
  probability: 'chanceOfClose',
  'chance of close (30)': 'chanceNext30',
  'chance 30': 'chanceNext30',
  '30 day': 'chanceNext30',
  'chance of close (60)': 'chanceNext60',
  'chance 60': 'chanceNext60',
  '60 day': 'chanceNext60',
  'exp close date': 'expectedCloseMonth',
  'expected close': 'expectedCloseMonth',
  'close date': 'expectedCloseMonth',
  'close?': 'closeStatus',
  'close status': 'closeStatus',
  status: 'closeStatus',
};

// ---------------------------------------------------------------------------
// Actuals columns (bottom of current month tab)
// ---------------------------------------------------------------------------
export const ACTUALS_COLUMN_MAP: Record<string, string> = {
  Deal: 'partnerName',
  'Deal Value': 'dealValue',
  Owner: 'salesperson',
  State: 'state',
  Pipeline: 'pipeline',
  Stage: 'stage',
  'Close?': 'closeStatus',
};

export const ACTUALS_SYNONYMS: Record<string, string> = {
  deal: 'partnerName',
  'deal name': 'partnerName',
  partner: 'partnerName',
  'partner name': 'partnerName',
  'deal value': 'dealValue',
  value: 'dealValue',
  amount: 'dealValue',
  owner: 'salesperson',
  salesperson: 'salesperson',
  'sales person': 'salesperson',
  state: 'state',
  pipeline: 'pipeline',
  stage: 'stage',
  'close status': 'closeStatus',
  'close?': 'closeStatus',
};

// ---------------------------------------------------------------------------
// "2026" yearly tab – section label markers (case-insensitive substring match)
// ---------------------------------------------------------------------------
export const TOP_SHEET_MARKERS = {
  modeledRevenue: 'Model Projected Closed Revenue',
  actualRevenue: 'Actual Closed Revenue',
  revenueVariance: 'Projected vs Actual',
  modeledPartners: 'Model Projected New Partners',
  actualPartners: 'Actual Closed Partners',
  projectedAvgPartnerValue: 'Projected Average New Partner Value',
  actualAvgPartnerValue: 'Actual New Partner Value',
  projectedAvgPartnerCount: 'Projected Average Number of New Partners',
  actualAvgPartnerCount: 'Actual Average New Monthly Partners',
};

/** Month short names used as column headers in the yearly tab */
export const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
