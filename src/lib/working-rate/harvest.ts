import { HarvestClient, HarvestUser, HarvestTimeEntry } from './types';

const HARVEST_BASE_URL = 'https://api.harvestapp.com/v2';

function getHeaders(): HeadersInit {
  const token = process.env.HARVEST_ACCESS_TOKEN;
  const accountId = process.env.HARVEST_ACCOUNT_ID;
  if (!token || !accountId) {
    throw new Error('Missing HARVEST_ACCESS_TOKEN or HARVEST_ACCOUNT_ID');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Harvest-Account-Id': accountId,
    'User-Agent': 'WorkingRateDashboard (harbinger@example.com)',
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
      throw new Error(`Harvest API error: ${res.status} ${res.statusText}`);
    }
    return res;
  }
  throw new Error('Harvest API: max retries exceeded');
}

async function fetchAllPages<T>(
  endpoint: string,
  dataKey: string,
  params: Record<string, string> = {},
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const searchParams = new URLSearchParams({
      ...params,
      page: String(page),
      per_page: '100',
    });
    const res = await fetchWithRetry(
      `${HARVEST_BASE_URL}${endpoint}?${searchParams}`,
    );
    const data = await res.json();
    results.push(...(data[dataKey] as T[]));
    hasMore = data.next_page !== null;
    page++;
  }

  return results;
}

export async function getClients(): Promise<HarvestClient[]> {
  return fetchAllPages<HarvestClient>('/clients', 'clients');
}

export async function getUsers(): Promise<HarvestUser[]> {
  return fetchAllPages<HarvestUser>('/users', 'users');
}

export async function getTimeEntries(
  from: string,
  to: string,
  clientId?: number,
  userId?: number,
): Promise<HarvestTimeEntry[]> {
  const params: Record<string, string> = { from, to };
  if (clientId) params.client_id = String(clientId);
  if (userId) params.user_id = String(userId);
  return fetchAllPages<HarvestTimeEntry>(
    '/time_entries',
    'time_entries',
    params,
  );
}
