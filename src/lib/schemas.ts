import { z } from 'zod';

/** Zod schema for a normalised pipeline prospect. */
export const ProspectSchema = z.object({
  prospectName: z.string(),
  dealValue: z.number(),
  oneTime: z.number(),
  onboarding: z.number(),
  ongoing: z.number(),
  owner: z.string(),
  marketingDirector: z.string(),
  pipeline: z.string(),
  state: z.string(),
  stage: z.string(),
  expWindow: z.string(),
  expectedCloseMonth: z.string(),
  expectedStartDate: z.string(),
  chanceOfClose: z.number().min(0).max(1),
  chanceNext30: z.number().min(0).max(1),
  chanceNext60: z.number().min(0).max(1),
  closeStatus: z.string(),
  _raw: z.record(z.string(), z.string()),
});

/** Zod schema for a normalised actuals row. */
export const ActualSchema = z.object({
  partnerName: z.string(),
  dealValue: z.number(),
  salesperson: z.string(),
  state: z.string(),
  pipeline: z.string(),
  stage: z.string(),
  closeStatus: z.string(),
  _raw: z.record(z.string(), z.string()),
});

/** Zod schema for monthly data. */
export const MonthlyDataSchema = z.object({
  pipeline: z.array(ProspectSchema),
  actuals: z.array(ActualSchema),
  actualsDetected: z.boolean(),
  warnings: z.array(z.string()),
});

/** Zod schema for a single Top Sheet month row. */
export const TopSheetMonthSchema = z.object({
  month: z.string(),
  monthIndex: z.number(),
  modeledRevenue: z.number(),
  actualRevenue: z.number(),
  revenueVariance: z.number(),
  modeledRevenueRolling: z.number(),
  actualRevenueRolling: z.number(),
  modeledPartners: z.number(),
  actualPartners: z.number(),
  partnersVariance: z.number(),
  modeledPartnersRolling: z.number(),
  actualPartnersRolling: z.number(),
});

export const TopSheetDataSchema = z.object({
  months: z.array(TopSheetMonthSchema),
  projectedAvgPartnerValue: z.number(),
  actualAvgPartnerValue: z.number(),
  projectedAvgPartnerCount: z.number(),
  actualAvgPartnerCount: z.number(),
  revenueAccuracy: z.number(),
  partnersAccuracy: z.number(),
  warnings: z.array(z.string()),
});
