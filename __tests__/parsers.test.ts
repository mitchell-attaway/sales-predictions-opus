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

describe('parseTopSheetCsv', () => {
  const result = parseTopSheetCsv(TOPSHEET_CSV);

  it('parses 12 months of data', () => {
    expect(result.months).toHaveLength(12);
  });

  it('has month names in order', () => {
    expect(result.months[0].month).toBe('Jan');
    expect(result.months[11].month).toBe('Dec');
  });

  it('parses modeled revenue', () => {
    expect(result.months[0].modeledRevenue).toBe(350000);
    expect(result.months[5].modeledRevenue).toBe(350000);
  });

  it('parses actual revenue', () => {
    expect(result.months[0].actualRevenue).toBeCloseTo(355140.62, 0);
    expect(result.months[1].actualRevenue).toBeCloseTo(281460.84, 0);
  });

  it('parses modeled partners', () => {
    expect(result.months[0].modeledPartners).toBe(2);
    expect(result.months[6].modeledPartners).toBe(2.5);
  });

  it('parses actual partners', () => {
    expect(result.months[0].actualPartners).toBe(2);
    expect(result.months[3].actualPartners).toBe(5);
  });

  it('extracts projected avg partner value', () => {
    expect(result.projectedAvgPartnerValue).toBe(175000);
  });

  it('extracts actual avg partner value', () => {
    expect(result.actualAvgPartnerValue).toBeCloseTo(100881.7, 0);
  });
});
