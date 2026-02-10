import { readFileSync } from 'fs';
import path from 'path';
import { parseMonthlyCsv } from '@/lib/parsers/monthly';
import { parseTopSheetCsv } from '@/lib/parsers/topsheet';

const MONTHLY_CSV = readFileSync(
  path.join(__dirname, '..', 'data', 'monthly-sample.csv'),
  'utf-8'
);

const TOPSHEET_CSV = readFileSync(
  path.join(__dirname, '..', 'data', 'topsheet-sample.csv'),
  'utf-8'
);

describe('parseMonthlyCsv', () => {
  const result = parseMonthlyCsv(MONTHLY_CSV);

  it('parses pipeline rows', () => {
    expect(result.pipeline.length).toBeGreaterThan(0);
  });

  it('extracts prospect names', () => {
    const names = result.pipeline.map((p) => p.prospectName);
    expect(names).toContain('Seydel');
    expect(names).toContain('Greenfield Solar');
  });

  it('normalises deal values as numbers', () => {
    const seydel = result.pipeline.find((p) => p.prospectName === 'Seydel');
    expect(seydel).toBeDefined();
    expect(seydel!.dealValue).toBe(225000);
  });

  it('normalises percent fields to 0-1', () => {
    const seydel = result.pipeline.find((p) => p.prospectName === 'Seydel');
    expect(seydel).toBeDefined();
    expect(seydel!.chanceOfClose).toBe(0.10);
    expect(seydel!.chanceNext30).toBe(0.10);
    expect(seydel!.chanceNext60).toBe(0.05);
  });

  it('extracts owner and marketing director', () => {
    const seydel = result.pipeline.find((p) => p.prospectName === 'Seydel');
    expect(seydel!.owner).toBe('Troy Williams');
    expect(seydel!.marketingDirector).toBe('Stephen Mitchell');
  });

  it('detects the actuals section', () => {
    expect(result.actualsDetected).toBe(true);
  });

  it('parses actuals rows', () => {
    expect(result.actuals.length).toBeGreaterThan(0);
  });

  it('extracts actuals partner names and values', () => {
    const estrada = result.actuals.find((a) => a.partnerName === 'Estrada & Sons');
    expect(estrada).toBeDefined();
    expect(estrada!.dealValue).toBe(40100);
  });

  it('does not include summary rows as pipeline data', () => {
    const names = result.pipeline.map((p) => p.prospectName.toLowerCase());
    expect(names).not.toContain('number of close');
    expect(names).not.toContain('dollar');
  });

  it('handles CSV with no actuals section gracefully', () => {
    const csvWithoutActuals = MONTHLY_CSV.split('End of MONTH')[0];
    const r = parseMonthlyCsv(csvWithoutActuals);
    expect(r.actualsDetected).toBe(false);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.pipeline.length).toBeGreaterThan(0);
  });
});

describe('parseTopSheetCsv (2026 tab)', () => {
  const result = parseTopSheetCsv(TOPSHEET_CSV);

  it('parses 12 months of data', () => {
    expect(result.months).toHaveLength(12);
  });

  it('has month names in order', () => {
    expect(result.months[0].month).toBe('Jan');
    expect(result.months[11].month).toBe('Dec');
  });

  it('parses modeled revenue (Jan = $432,450)', () => {
    expect(result.months[0].modeledRevenue).toBe(432450);  // Jan
    expect(result.months[3].modeledRevenue).toBe(576600);  // Apr
    expect(result.months[11].modeledRevenue).toBe(432450); // Dec (prior year)
  });

  it('parses actual revenue (only Dec and Jan have values)', () => {
    expect(result.months[11].actualRevenue).toBeCloseTo(1084751.57, 0); // Dec
    expect(result.months[0].actualRevenue).toBeCloseTo(545932.51, 0);   // Jan
    expect(result.months[1].actualRevenue).toBe(0); // Feb — empty in CSV
    expect(result.months[2].actualRevenue).toBe(0); // Mar — empty in CSV
  });

  it('parses modeled partners', () => {
    expect(result.months[0].modeledPartners).toBe(3);  // Jan
    expect(result.months[3].modeledPartners).toBe(4);  // Apr
    expect(result.months[11].modeledPartners).toBe(3); // Dec
  });

  it('parses actual partners (only Dec and Jan have values)', () => {
    expect(result.months[11].actualPartners).toBe(6); // Dec
    expect(result.months[0].actualPartners).toBe(4);  // Jan
    expect(result.months[1].actualPartners).toBe(0);  // Feb — empty
  });

  it('extracts projected avg partner value (column-aware)', () => {
    expect(result.projectedAvgPartnerValue).toBe(144150);
  });

  it('extracts projected avg partner count (column-aware)', () => {
    expect(result.projectedAvgPartnerCount).toBe(3.5);
  });

  it('extracts actual avg partner value as 0 when empty', () => {
    expect(result.actualAvgPartnerValue).toBe(0);
  });

  it('extracts actual avg partner count (column-aware)', () => {
    expect(result.actualAvgPartnerCount).toBe(2);
  });

  it('extracts revenue accuracy (column-aware)', () => {
    expect(result.revenueAccuracy).toBeCloseTo(2.3077, 2);
  });

  it('extracts partners accuracy as 0 when #DIV/0!', () => {
    expect(result.partnersAccuracy).toBe(0);
  });
});
