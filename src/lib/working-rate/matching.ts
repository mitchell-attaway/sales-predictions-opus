import { Partner, HarvestClient } from './types';
import partnerMappingJson from './partner-mapping.json';

const loadedMapping: Record<string, string> = Object.fromEntries(
  Object.entries(partnerMappingJson).filter(([key]) => !key.startsWith('_')),
);

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(llc|inc|corp|corporation|ltd|limited|co|company)\b/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchPartners(
  partners: Partner[],
  harvestClients: HarvestClient[],
  manualMapping?: Record<string, string>,
): { matched: Partner[]; unmatched: string[] } {
  const mapping = { ...loadedMapping, ...(manualMapping ?? {}) };
  const unmatched: string[] = [];

  const matched = partners.map((partner) => {
    // 1. Check manual mapping
    const manualName = mapping[partner.name];
    if (manualName) {
      const client = harvestClients.find(
        (c) => c.name.toLowerCase() === manualName.toLowerCase(),
      );
      if (client) {
        return { ...partner, harvestClientId: client.id };
      }
    }

    // 2. Exact match (case-insensitive, trimmed)
    const exactMatch = harvestClients.find(
      (c) => c.name.toLowerCase().trim() === partner.name.toLowerCase().trim(),
    );
    if (exactMatch) {
      return { ...partner, harvestClientId: exactMatch.id };
    }

    // 3. Normalized match
    const normalizedPartner = normalize(partner.name);
    const normalizedMatch = harvestClients.find(
      (c) => normalize(c.name) === normalizedPartner,
    );
    if (normalizedMatch) {
      return { ...partner, harvestClientId: normalizedMatch.id };
    }

    // 4. Contains match
    const containsMatch = harvestClients.find(
      (c) =>
        normalize(c.name).includes(normalizedPartner) ||
        normalizedPartner.includes(normalize(c.name)),
    );
    if (containsMatch) {
      return { ...partner, harvestClientId: containsMatch.id };
    }

    // Unmatched
    unmatched.push(partner.name);
    return partner;
  });

  if (unmatched.length > 0) {
    console.warn('Unmatched partners:', unmatched);
  }

  return { matched, unmatched };
}
