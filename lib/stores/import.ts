import 'server-only';

import { parseCouponCsv } from '@/lib/coupons/import/parse';
import { parseBoolean, parseNonNegativeInteger } from '@/lib/coupons/import/normalize';
import { createCouponImportStoreSlug, normalizeStoreIdentity } from '@/lib/coupons/import/stores';
import { requireAdmin } from '@/utils/auth/require-admin';

const previewLimit = 100;
const storeImportMaxRows = 1_000;
const fields = ['name', 'slug', 'base_url', 'affiliate_base_url', 'logo_url', 'is_active', 'is_featured', 'display_order'] as const;
type StoreField = typeof fields[number];
type StoreMapping = Partial<Record<StoreField, string>>;

type PreparedStore = { rowNumber: number; name: string | null; slug: string | null; baseUrl: string | null; affiliateBaseUrl: string | null; logoUrl: string | null; isActive: boolean; isFeatured: boolean; displayOrder: number; problems: string[]; status: 'valid' | 'duplicate' | 'invalid' };

function publicError(message: string) { return new Error(message); }
function field(row: Record<string, string>, mapping: StoreMapping, key: StoreField) { const column = mapping[key]; return column ? row[column] ?? '' : ''; }
function normalizeUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try { const url = new URL(value.trim()); return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null; } catch { return null; }
}
function suggestedMapping(headers: string[]): StoreMapping {
  const aliases: Record<StoreField, string[]> = {
    name: ['store', 'store name', 'merchant', 'merchant name', 'brand', 'name'], slug: ['slug', 'store slug'],
    base_url: ['base url', 'website', 'website url', 'store url', 'url', 'homepage'], affiliate_base_url: ['affiliate url', 'affiliate base url', 'tracking url'],
    logo_url: ['logo', 'logo url'], is_active: ['active', 'is active'], is_featured: ['featured', 'is featured'], display_order: ['display order', 'sort order', 'order'],
  };
  const normalize = (value: string) => value.toLowerCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const result: StoreMapping = {}; const used = new Set<string>();
  for (const key of fields) {
    const matches = headers.filter((header) => aliases[key].includes(normalize(header)) && !used.has(header));
    if (matches.length === 1) { result[key] = matches[0]; used.add(matches[0]); }
  }
  return result;
}
async function read(file: File) {
  if (!(file instanceof File)) throw publicError('Choose a CSV file.');
  const parsed = parseCouponCsv(new Uint8Array(await file.arrayBuffer()));
  if (parsed.rows.length > storeImportMaxRows) throw publicError(`Store CSV files may contain at most ${storeImportMaxRows.toLocaleString()} rows.`);
  return parsed;
}
function validateMapping(mapping: StoreMapping, headers: string[]) {
  if (!mapping.name || !mapping.base_url) throw publicError('Map Store Name and Base URL before previewing.');
  if (Object.entries(mapping).some(([key, column]) => !fields.includes(key as StoreField) || typeof column !== 'string' || !headers.includes(column))) throw publicError('The mapping does not match this CSV file.');
}
function prepare(rows: Record<string, string>[], mapping: StoreMapping, existing: Array<{ name: string; slug: string }>) {
  const existingSlugs = new Set(existing.map((store) => store.slug));
  const existingNames = new Set(existing.map((store) => normalizeStoreIdentity(store.name)));
  const seenSlugs = new Set<string>();
  return rows.map((row, index): PreparedStore => {
    const name = field(row, mapping, 'name').trim() || null;
    const slug = (field(row, mapping, 'slug').trim() || createCouponImportStoreSlug(name)) ?? null;
    const baseUrl = normalizeUrl(field(row, mapping, 'base_url'));
    const affiliateRaw = field(row, mapping, 'affiliate_base_url'); const affiliateBaseUrl = affiliateRaw.trim() ? normalizeUrl(affiliateRaw) : null;
    const logoRaw = field(row, mapping, 'logo_url'); const logoUrl = logoRaw.trim() ? normalizeUrl(logoRaw) : null;
    const activeRaw = field(row, mapping, 'is_active'); const featuredRaw = field(row, mapping, 'is_featured'); const orderRaw = field(row, mapping, 'display_order');
    const activeParsed = activeRaw.trim() ? parseBoolean(activeRaw) : true; const featuredParsed = featuredRaw.trim() ? parseBoolean(featuredRaw) : false; const orderParsed = orderRaw.trim() ? parseNonNegativeInteger(orderRaw) : 0;
    const problems: string[] = [];
    if (!name) problems.push('Store Name is required.'); if (!slug) problems.push('A safe ASCII slug could not be generated. Provide a Slug.'); if (!baseUrl) problems.push('A valid http(s) Base URL is required.');
    if (affiliateRaw.trim() && !affiliateBaseUrl) problems.push('Affiliate URL must be a valid http(s) URL.'); if (logoRaw.trim() && !logoUrl) problems.push('Logo URL must be a valid http(s) URL.');
    if (activeParsed === null) problems.push('Active must be a supported boolean.'); if (featuredParsed === null) problems.push('Featured must be a supported boolean.'); if (orderParsed === null) problems.push('Display Order must be a non-negative integer.');
    let status: PreparedStore['status'] = problems.length ? 'invalid' : 'valid';
    if (status === 'valid' && slug && (existingSlugs.has(slug) || existingNames.has(normalizeStoreIdentity(name)))) { status = 'duplicate'; problems.push('An existing store already uses this name or slug.'); }
    if (status === 'valid' && slug && seenSlugs.has(slug)) { status = 'duplicate'; problems.push('Duplicate store slug in this file.'); }
    if (slug) seenSlugs.add(slug);
    return { rowNumber: index + 2, name, slug, baseUrl, affiliateBaseUrl, logoUrl, isActive: activeParsed ?? true, isFeatured: featuredParsed ?? false, displayOrder: orderParsed ?? 0, problems, status };
  });
}
async function preview(file: File, mapping: StoreMapping) {
  const { supabase } = await requireAdmin(); const parsed = await read(file); validateMapping(mapping, parsed.headers);
  const { data: existing, error } = await supabase.from('stores').select('name, slug'); if (error || !existing) throw publicError('Existing stores could not be checked.');
  const rows = prepare(parsed.rows, mapping, existing);
  const counts = rows.reduce((result, row) => { result.total++; result[row.status]++; return result; }, { total: 0, valid: 0, duplicate: 0, invalid: 0 });
  return { counts, preview: rows.slice(0, previewLimit) };
}

export async function analyzeStoreImport(file: File) { await requireAdmin(); const parsed = await read(file); return { headers: parsed.headers, rowCount: parsed.rows.length, suggestedMapping: suggestedMapping(parsed.headers) }; }
export async function previewStoreImport(file: File, mapping: StoreMapping) { return preview(file, mapping); }
export async function commitStoreImport(file: File, mapping: StoreMapping) {
  const { supabase } = await requireAdmin(); const result = await preview(file, mapping);
  const eligible = result.preview.length === result.counts.total ? result.preview.filter((row) => row.status === 'valid') : (await (async () => { const parsed = await read(file); const { data } = await supabase.from('stores').select('name, slug'); return prepare(parsed.rows, mapping, data ?? []).filter((row) => row.status === 'valid'); })());
  if (!eligible.length) throw publicError('There are no valid new stores to create.');
  const { error } = await supabase.from('stores').insert(eligible.map((row) => ({ name: row.name!, slug: row.slug!, base_url: row.baseUrl!, affiliate_base_url: row.affiliateBaseUrl, logo_url: row.logoUrl, is_active: row.isActive, is_featured: row.isFeatured, display_order: row.displayOrder })));
  if (error) throw publicError('Store import could not be completed. No stores were created.');
  return { inserted: eligible.length, duplicates: result.counts.duplicate, invalid: result.counts.invalid };
}
