/**
 * Airtable Schema Discovery Script
 *
 * Run with: npx tsx scripts/discover-schema.ts
 *
 * Discovers all Airtable bases, tables, and fields to help
 * map the correct base/table IDs for the Working Rate Dashboard.
 *
 * Requires AIRTABLE_API_KEY in .env.local
 */

import * as fs from 'fs';
import * as path from 'path';

// Load env from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = value;
    }
  }
}

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

if (!AIRTABLE_API_KEY) {
  console.error('ERROR: AIRTABLE_API_KEY not found in .env.local');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
};

interface Base {
  id: string;
  name: string;
  permissionLevel: string;
}

interface Field {
  id: string;
  name: string;
  type: string;
  description?: string;
  options?: Record<string, unknown>;
}

interface Table {
  id: string;
  name: string;
  description?: string;
  fields: Field[];
  primaryFieldId: string;
}

async function discoverBases(): Promise<Base[]> {
  console.log('\n=== Discovering Airtable Bases ===\n');

  const res = await fetch('https://api.airtable.com/v0/meta/bases', {
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to list bases: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const bases: Base[] = data.bases;

  for (const base of bases) {
    console.log(`  Base: ${base.name}`);
    console.log(`    ID: ${base.id}`);
    console.log(`    Permission: ${base.permissionLevel}`);
    console.log('');
  }

  return bases;
}

async function discoverTables(baseId: string, baseName: string): Promise<Table[]> {
  console.log(`\n=== Tables in "${baseName}" (${baseId}) ===\n`);

  const res = await fetch(
    `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
    { headers },
  );

  if (!res.ok) {
    throw new Error(
      `Failed to list tables for ${baseId}: ${res.status} ${res.statusText}`,
    );
  }

  const data = await res.json();
  const tables: Table[] = data.tables;

  for (const table of tables) {
    console.log(`  Table: ${table.name}`);
    console.log(`    ID: ${table.id}`);
    if (table.description) console.log(`    Description: ${table.description}`);
    console.log(`    Primary Field: ${table.primaryFieldId}`);
    console.log('    Fields:');

    for (const field of table.fields) {
      console.log(`      - ${field.name} (${field.type}) [${field.id}]`);
      if (field.description) {
        console.log(`        ${field.description}`);
      }
    }
    console.log('');
  }

  return tables;
}

async function main() {
  console.log('Airtable Schema Discovery');
  console.log('='.repeat(50));

  try {
    const bases = await discoverBases();

    for (const base of bases) {
      const tables = await discoverTables(base.id, base.name);

      // Look for partner/client tables
      for (const table of tables) {
        const fieldNames = table.fields.map((f) => f.name.toLowerCase());
        const hasPartnerFields =
          fieldNames.some((n) =>
            ['name', 'partner', 'client', 'company'].some((k) =>
              n.includes(k),
            ),
          ) &&
          fieldNames.some((n) =>
            ['invoice', 'amount', 'fee', 'retainer', 'mrr', 'revenue'].some(
              (k) => n.includes(k),
            ),
          );

        if (hasPartnerFields) {
          console.log('  *** LIKELY PARTNER TABLE ***');
          console.log(`  Recommended env vars:`);
          console.log(`    AIRTABLE_BASE_ID=${base.id}`);
          console.log(`    AIRTABLE_TABLE_ID=${table.id}`);
          console.log('');
        }
      }
    }

    console.log('\n=== Done ===');
    console.log(
      'Add the discovered AIRTABLE_BASE_ID and AIRTABLE_TABLE_ID to your .env.local file.',
    );
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
