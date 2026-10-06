export interface CouponImportStore {
  id: string;
  name: string;
  slug: string;
  websiteUrl?: string | null;
}

export interface CouponStoreAlias {
  aliasValue: string;
  normalizedAlias: string;
  store: CouponImportStore;
}

export type CouponStoreResolutionStatus = 'auto_resolved' | 'needs_review' | 'unresolved' | 'new_store_candidate';

export interface CouponStoreResolution {
  sourceValue: string | null;
  normalizedValue: string | null;
  status: CouponStoreResolutionStatus;
  store: CouponImportStore | null;
  candidates: CouponImportStore[];
  reason: string;
  confidence: 'high' | 'review' | 'none';
}

export function normalizeStoreIdentity(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const normalized = String(value)
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized || null;
}

/** Returns a hostname only; URL paths and query strings are not identities. */
export function normalizeStoreDomain(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim().toLocaleLowerCase();
  if (!candidate) return null;
  try {
    const url = new URL(candidate.includes('://') ? candidate : `https://${candidate}`);
    return url.hostname.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

/** A candidate slug is only generated for safe ASCII catalog names. */
export function createCouponImportStoreSlug(value: unknown): string | null {
  const source = typeof value === 'string' ? value.trim().toLocaleLowerCase() : '';
  if (!source) return null;
  const slug = source
    .replace(/&/g, ' and ')
    .replace(/[’']/g, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || null;
}

function uniqueStores(stores: CouponImportStore[]): CouponImportStore[] {
  return [...new Map(stores.map((store) => [store.id, store])).values()];
}

function storesMatchingIdentity(identity: string, stores: CouponImportStore[]): CouponImportStore[] {
  const sourceDomain = normalizeStoreDomain(identity);
  return uniqueStores(stores.filter((store) => {
    const textMatches = [store.id, store.slug, store.name]
      .some((candidate) => normalizeStoreIdentity(candidate) === identity);
    const domainMatches = sourceDomain !== null && normalizeStoreDomain(store.websiteUrl) === sourceDomain;
    return textMatches || domainMatches;
  }));
}

function terminalUaeIdentity(identity: string): string | null {
  return identity.endsWith(' uae') ? identity.slice(0, -4).trim() || null : null;
}

/** Resolves only identities with exactly one active-store result; no fuzzy matching. */
export function resolveCouponImportStoreDetail(value: unknown, stores: CouponImportStore[], aliases: CouponStoreAlias[] = []): CouponStoreResolution {
  const sourceValue = typeof value === 'string' || typeof value === 'number' ? String(value).trim() || null : null;
  const normalizedValue = normalizeStoreIdentity(value);
  if (!normalizedValue) {
    return { sourceValue, normalizedValue, status: 'unresolved', store: null, candidates: [], reason: 'A store value is required.', confidence: 'none' };
  }

  const matchingAliases = aliases.filter((alias) => alias.normalizedAlias === normalizedValue);
  if (matchingAliases.length === 1) {
    return { sourceValue, normalizedValue, status: 'auto_resolved', store: matchingAliases[0].store, candidates: [matchingAliases[0].store], reason: 'Approved store alias.', confidence: 'high' };
  }
  if (matchingAliases.length > 1) {
    return { sourceValue, normalizedValue, status: 'needs_review', store: null, candidates: uniqueStores(matchingAliases.map((alias) => alias.store)), reason: 'The saved alias is inconsistent and needs admin review.', confidence: 'review' };
  }

  const exactMatches = storesMatchingIdentity(normalizedValue, stores);
  if (exactMatches.length === 1) {
    return { sourceValue, normalizedValue, status: 'auto_resolved', store: exactMatches[0], candidates: exactMatches, reason: normalizeStoreDomain(value) ? 'Exact active-store website domain.' : 'Exact active-store identity.', confidence: 'high' };
  }
  if (exactMatches.length > 1) {
    return { sourceValue, normalizedValue, status: 'needs_review', store: null, candidates: exactMatches, reason: 'This exact identity matches more than one active store.', confidence: 'review' };
  }

  const withoutUae = terminalUaeIdentity(normalizedValue);
  if (withoutUae) {
    const uaeMatches = storesMatchingIdentity(withoutUae, stores);
    if (uaeMatches.length === 1) {
      return { sourceValue, normalizedValue, status: 'auto_resolved', store: uaeMatches[0], candidates: uaeMatches, reason: 'Exact active-store identity after terminal UAE qualifier.', confidence: 'high' };
    }
    if (uaeMatches.length > 1) {
      return { sourceValue, normalizedValue, status: 'needs_review', store: null, candidates: uaeMatches, reason: 'Terminal UAE qualifier leaves more than one active-store match.', confidence: 'review' };
    }
  }

  return { sourceValue, normalizedValue, status: 'new_store_candidate', store: null, candidates: [], reason: 'No deterministic match exists in the active store catalog.', confidence: 'none' };
}

export function resolveCouponImportStore(value: unknown, stores: CouponImportStore[], aliases: CouponStoreAlias[] = []): CouponImportStore | null {
  const resolution = resolveCouponImportStoreDetail(value, stores, aliases);
  return resolution.status === 'auto_resolved' ? resolution.store : null;
}
