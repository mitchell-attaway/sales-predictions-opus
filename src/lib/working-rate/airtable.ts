import { Partner } from './types';

const AIRTABLE_BASE_URL = 'https://api.airtable.com/v0';

function getHeaders(): HeadersInit {
  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing AIRTABLE_API_KEY');
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, {
      headers: getHeaders(),
      next: { revalidate: 300 },
    });
    if (res.status === 429 && i < retries) {
      const delay = Math.pow(2, i + 1) * 1000;
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    if (!res.ok) {
      throw new Error(`Airtable API error: ${res.status} ${res.statusText}`);
    }
    return res;
  }
  throw new Error('Airtable API: max retries exceeded');
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

export async function getPartners(): Promise<Partner[]> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_TABLE_ID;
  if (!baseId || !tableId) {
    throw new Error('Missing AIRTABLE_BASE_ID or AIRTABLE_TABLE_ID');
  }

  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    if (offset) params.set('offset', offset);

    const url = `${AIRTABLE_BASE_URL}/${baseId}/${tableId}?${params}`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    records.push(...(data.records as AirtableRecord[]));
    offset = data.offset;
  } while (offset);

  return records.map(mapRecordToPartner);
}

function mapRecordToPartner(record: AirtableRecord): Partner {
  const f = record.fields;

  // Flexible field mapping — try common field name variations
  const name =
    findField(f, ['Name', 'Partner Name', 'Partner', 'Client', 'Client Name', 'Company']) ?? '';
  const invoice = findNumericField(f, [
    'Monthly Invoice',
    'Invoice',
    'Monthly Amount',
    'Amount',
    'Monthly Fee',
    'Fee',
    'Monthly Retainer',
    'Retainer',
    'MRR',
  ]);
  const active = findBooleanField(f, ['Active', 'Is Active', 'Status', 'Active?']);
  const director = findField(f, [
    'Marketing Director',
    'MD',
    'Director',
    'Account Manager',
    'AM',
    'Assigned To',
    'Owner',
  ]) ?? '';

  return {
    id: record.id,
    name: String(name),
    monthlyInvoice: invoice,
    isActive: active,
    marketingDirector: String(director),
  };
}

function findField(
  fields: Record<string, unknown>,
  candidates: string[],
): string | undefined {
  for (const key of candidates) {
    if (fields[key] !== undefined && fields[key] !== null) {
      const val = fields[key];
      if (Array.isArray(val)) return val.join(', ');
      return String(val);
    }
  }
  return undefined;
}

function findNumericField(
  fields: Record<string, unknown>,
  candidates: string[],
): number {
  for (const key of candidates) {
    if (fields[key] !== undefined && fields[key] !== null) {
      const val = Number(fields[key]);
      if (!isNaN(val)) return val;
    }
  }
  return 0;
}

function findBooleanField(
  fields: Record<string, unknown>,
  candidates: string[],
): boolean {
  for (const key of candidates) {
    if (fields[key] !== undefined && fields[key] !== null) {
      const val = fields[key];
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        const lower = val.toLowerCase();
        return lower === 'true' || lower === 'active' || lower === 'yes';
      }
    }
  }
  return true; // default to active if field not found
}
