/** A pipeline prospect row (normalised). */
export interface Prospect {
  prospectName: string;
  dealValue: number;
  oneTime: number;
  onboarding: number;
  ongoing: number;
  owner: string;
  marketingDirector: string;
  pipeline: string;
  state: string;
  stage: string;
  expWindow: string;
  expectedCloseMonth: string;
  expectedStartDate: string;
  chanceOfClose: number;
  chanceNext30: number;
  chanceNext60: number;
  closeStatus: string;
  /** Raw row data for any extra columns */
  _raw: Record<string, string>;
}

/** An actuals row (normalised). */
export interface Actual {
  partnerName: string;
  dealValue: number;
  salesperson: string;
  state: string;
  pipeline: string;
  stage: string;
  closeStatus: string;
  _raw: Record<string, string>;
}

/** Result of parsing a monthly tab CSV. */
export interface MonthlyData {
  pipeline: Prospect[];
  actuals: Actual[];
  actualsDetected: boolean;
  warnings: string[];
}

/** A single month's data point from the Top Sheet. */
export interface TopSheetMonth {
  month: string; // "Jan", "Feb", etc.
  monthIndex: number; // 0-based
  modeledRevenue: number;
  actualRevenue: number;
  revenueVariance: number;
  modeledRevenueRolling: number;
  actualRevenueRolling: number;
  modeledPartners: number;
  actualPartners: number;
  partnersVariance: number;
  modeledPartnersRolling: number;
  actualPartnersRolling: number;
}

/** Top Sheet summary data. */
export interface TopSheetData {
  months: TopSheetMonth[];
  projectedAvgPartnerValue: number;
  actualAvgPartnerValue: number;
  projectedAvgPartnerCount: number;
  actualAvgPartnerCount: number;
  revenueAccuracy: number;
  partnersAccuracy: number;
  warnings: string[];
}

/** YTD computed metrics. */
export interface YtdMetrics {
  ytdModeledRevenue: number;
  ytdActualRevenue: number;
  ytdVarianceDollars: number;
  ytdVariancePercent: number;
  ytdModeledPartners: number;
  ytdActualPartners: number;
  ytdPartnersVariance: number;
}

/** API response shape for /api/monthly */
export interface MonthlyApiResponse {
  data: MonthlyData | null;
  error: string | null;
  fetchedAt: string;
}

/** API response shape for /api/topsheet */
export interface TopSheetApiResponse {
  data: TopSheetData | null;
  error: string | null;
  fetchedAt: string;
}
