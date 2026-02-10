/**
 * Server-side data fetching for Google Sheets CSV.
 *
 * Fetches CSV text from a URL, with optional fallback to local fixtures.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { isMockMode } from '@/config/sheet';

/**
 * Fetch CSV text. In mock mode reads from local fixture files;
 * otherwise fetches from the given URL.
 */
export async function fetchCsv(
  url: string,
  mockFile: string
): Promise<string> {
  if (isMockMode()) {
    const filePath = path.join(process.cwd(), 'data', mockFile);
    return fs.readFile(filePath, 'utf-8');
  }

  const res = await fetch(url, {
    next: { revalidate: 300 },
    headers: {
      'User-Agent': 'SalesDashboard/1.0',
    },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch CSV from ${url}: ${res.status} ${res.statusText}`
    );
  }

  return res.text();
}
