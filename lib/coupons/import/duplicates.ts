import { normalizeCouponCode, normalizeOptionalText } from './normalize';

export function canonicalCouponFingerprint(storeId: unknown, code: unknown): string | null {
  const normalizedStoreId = normalizeOptionalText(storeId)?.toLowerCase();
  const normalizedCode = normalizeCouponCode(code);

  return normalizedStoreId && normalizedCode ? `${normalizedStoreId}:${normalizedCode}` : null;
}

export function findDuplicateFingerprints(fingerprints: Array<string | null>): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const fingerprint of fingerprints) {
    if (!fingerprint) continue;
    if (seen.has(fingerprint)) duplicates.add(fingerprint);
    seen.add(fingerprint);
  }

  return duplicates;
}
