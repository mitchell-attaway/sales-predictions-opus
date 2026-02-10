import { parseCurrency, parsePercent, buildColumnIndex } from '@/lib/normalize';

describe('parseCurrency', () => {
  it('parses dollar amounts with $ and commas', () => {
    expect(parseCurrency('$225,000.00')).toBe(225000);
  });

  it('parses plain numbers', () => {
    expect(parseCurrency('225000')).toBe(225000);
  });

  it('parses negative amounts', () => {
    expect(parseCurrency('-$63,398.54')).toBe(-63398.54);
  });

  it('returns 0 for empty/null/undefined', () => {
    expect(parseCurrency('')).toBe(0);
    expect(parseCurrency(null)).toBe(0);
    expect(parseCurrency(undefined)).toBe(0);
  });

  it('returns 0 for non-numeric strings', () => {
    expect(parseCurrency('abc')).toBe(0);
  });

  it('handles currency with spaces', () => {
    expect(parseCurrency('$ 1,000.50')).toBe(1000.5);
  });
});

describe('parsePercent', () => {
  it('parses "35%" to 0.35', () => {
    expect(parsePercent('35%')).toBe(0.35);
  });

  it('parses "0.35" to 0.35', () => {
    expect(parsePercent('0.35')).toBe(0.35);
  });

  it('parses "35" as percentage (> 1 heuristic)', () => {
    expect(parsePercent('35')).toBe(0.35);
  });

  it('parses "100%" to 1.0', () => {
    expect(parsePercent('100%')).toBe(1.0);
  });

  it('parses "10%" to 0.10', () => {
    expect(parsePercent('10%')).toBe(0.1);
  });

  it('parses "5%" to 0.05', () => {
    expect(parsePercent('5%')).toBe(0.05);
  });

  it('parses ".5" as 0.5', () => {
    expect(parsePercent('.5')).toBe(0.5);
  });

  it('returns 0 for empty/null/undefined', () => {
    expect(parsePercent('')).toBe(0);
    expect(parsePercent(null)).toBe(0);
    expect(parsePercent(undefined)).toBe(0);
  });
});

describe('buildColumnIndex', () => {
  it('maps exact header matches', () => {
    const headers = ['Deal', 'Deal Value', 'Owner', 'State'];
    const colMap: Record<string, string> = {
      Deal: 'prospectName',
      'Deal Value': 'dealValue',
      Owner: 'owner',
      State: 'state',
    };
    const result = buildColumnIndex(headers, colMap, {});
    expect(result).toEqual({
      prospectName: 0,
      dealValue: 1,
      owner: 2,
      state: 3,
    });
  });

  it('falls back to synonyms for unmatched headers', () => {
    const headers = ['Partner Name', 'Amount', 'Sales Rep'];
    const colMap: Record<string, string> = {};
    const synonyms: Record<string, string> = {
      'partner name': 'prospectName',
      amount: 'dealValue',
      'sales rep': 'owner',
    };
    const result = buildColumnIndex(headers, colMap, synonyms);
    expect(result).toEqual({
      prospectName: 0,
      dealValue: 1,
      owner: 2,
    });
  });

  it('handles trimming of headers', () => {
    const headers = [' Deal ', ' Deal Value '];
    const colMap: Record<string, string> = {
      Deal: 'prospectName',
      'Deal Value': 'dealValue',
    };
    const result = buildColumnIndex(headers, colMap, {});
    expect(result).toEqual({
      prospectName: 0,
      dealValue: 1,
    });
  });
});
