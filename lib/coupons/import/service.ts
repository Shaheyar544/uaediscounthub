import 'server-only';

import { createHash } from 'node:crypto';

import { canonicalCouponFingerprint, findDuplicateFingerprints } from './duplicates';
import { parseCouponCsv, suggestCouponColumnMapping } from './parse';
import { inferDiscountTypeFromValue } from './normalize';
import { resolveCouponImportStoreDetail, type CouponImportStore, type CouponStoreAlias, type CouponStoreResolution } from './stores';
import { couponImportFields, type CouponColumnMapping, type CouponImportPreviewRow, type CouponImportRowStatus } from './types';
import { validateCouponImportRow } from './validate';
import { requireCouponImportAdmin } from './authorization';

const VALIDATION_VERSION = 'coupon-import-v1';
const previewLimit = 100;

type Store = CouponImportStore & { is_active: boolean };
type StageInput = { file: File; mapping: CouponColumnMapping; defaultStoreId?: string | null };
const stagingChunkSize = 500;

function publicError(message: string) {
  return new Error(message);
}

async function readCsvFile(file: File) {
  if (!(file instanceof File)) throw publicError('Choose a CSV file to continue.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { bytes, parsed: parseCouponCsv(bytes) };
}

function field(row: Record<string, string>, mapping: CouponColumnMapping, key: keyof CouponColumnMapping) {
  const column = mapping[key];
  return column ? row[column] ?? '' : '';
}

function toDatabaseRow(row: ReturnType<typeof validateCouponImportRow>) {
  const data = row.normalized;
  return {
    store_id: data.storeId, code: data.code, title_en: data.titleEn, title_ar: data.titleAr,
    description_en: data.descriptionEn, description_ar: data.descriptionAr,
    discount_type: data.discountType, discount_value: data.discountValue == null ? null : String(data.discountValue),
    min_order_value: data.minOrderValue == null ? null : String(data.minOrderValue),
    max_uses: data.maxUses == null ? null : String(data.maxUses), expires_at: data.expiresAt,
    is_active: data.isActive == null ? null : String(data.isActive),
    is_verified: data.isVerified == null ? null : String(data.isVerified),
    is_exclusive: data.isExclusive == null ? null : String(data.isExclusive),
    product_id: data.productId, source: data.source ?? 'bulk_import',
  };
}

function preview(rowNumber: number, normalized: ReturnType<typeof validateCouponImportRow>, status: CouponImportRowStatus, problems: string[]): CouponImportPreviewRow {
  const data = normalized.normalized;
  return {
    rowNumber, code: data.code, store: data.storeId, title: data.titleEn,
    discount: data.discountValue == null ? null : (data.discountType === 'percent' ? data.discountValue + '%' : 'AED ' + data.discountValue),
    expiresAt: data.expiresAt, status, problems,
    warnings: normalized.warnings.map((warning) => warning.message),
  };
}

export async function analyzeCouponImport(file: File) {
  await requireCouponImportAdmin();
  const { parsed } = await readCsvFile(file);
  return { headers: parsed.headers, rowCount: parsed.rows.length, samples: parsed.rows.slice(0, 5), suggestedMapping: suggestCouponColumnMapping(parsed.headers) };
}

export async function stageCouponImport({ file, mapping, defaultStoreId }: StageInput) {
  const { supabase, user } = await requireCouponImportAdmin();
  const { bytes, parsed } = await readCsvFile(file);
  const required = ['code', 'title_en', 'discount_value'] as const;
  if (required.some((key) => !mapping[key])) throw publicError('Map Code, English Title, and Discount Value before validating.');
  if (!mapping.store && !defaultStoreId) throw publicError('Map a Store column or select a default store.');
  if (Object.entries(mapping).some(([field, column]) => !couponImportFields.includes(field as typeof couponImportFields[number]) || typeof column !== 'string' || !parsed.headers.includes(column))) {
    throw publicError('The mapping does not match this CSV file.');
  }

  const { data: stores, error: storesError } = await supabase.from('stores').select('id, name, slug, base_url, is_active').eq('is_active', true);
  if (storesError || !stores) throw publicError('Stores could not be loaded. Try again.');
  const activeStores = (stores as Array<Store & { base_url?: string | null }>).map((store) => ({
    ...store,
    websiteUrl: store.base_url ?? null,
  }));
  const { data: aliases, error: aliasesError } = await supabase
    .from('coupon_store_aliases')
    .select('alias_value, normalized_alias, stores!inner(id, name, slug, base_url, is_active)')
    .eq('status', 'approved')
    .eq('stores.is_active', true);
  if (aliasesError) throw publicError('Store aliases could not be loaded. Try again.');
  const approvedAliases: CouponStoreAlias[] = (aliases ?? []).flatMap((alias: any) => {
    const store = Array.isArray(alias.stores) ? alias.stores[0] : alias.stores;
    if (!store) return [];
    return [{
      aliasValue: alias.alias_value,
      normalizedAlias: alias.normalized_alias,
      store: { id: store.id, name: store.name, slug: store.slug, websiteUrl: store.base_url ?? null },
    }];
  });
  const defaultStore = defaultStoreId ? activeStores.find((store) => store.id === defaultStoreId) : undefined;
  if (defaultStoreId && !defaultStore) throw publicError('Choose an active default store.');

  const prepared = parsed.rows.map((raw, index) => {
    const storeResolution: CouponStoreResolution = mapping.store
      ? resolveCouponImportStoreDetail(field(raw, mapping, 'store'), activeStores, approvedAliases)
      : { sourceValue: null, normalizedValue: null, status: 'auto_resolved', store: defaultStore ?? null, candidates: defaultStore ? [defaultStore] : [], reason: 'Selected default active store.', confidence: 'high' };
    const store = storeResolution.store;
    const explicitDiscountType = field(raw, mapping, 'discount_type');
    const inferredDiscountType = mapping.discount_type ? null : inferDiscountTypeFromValue(field(raw, mapping, 'discount_value'));
    const input = {
      storeId: store?.id ?? null, code: field(raw, mapping, 'code'), titleEn: field(raw, mapping, 'title_en'),
      titleAr: field(raw, mapping, 'title_ar'), descriptionEn: field(raw, mapping, 'description_en'),
      descriptionAr: field(raw, mapping, 'description_ar'), discountType: explicitDiscountType || inferredDiscountType,
      discountTypeWasInferred: Boolean(inferredDiscountType),
      discountValue: field(raw, mapping, 'discount_value'), minOrderValue: field(raw, mapping, 'min_order_value'),
      maxUses: field(raw, mapping, 'max_uses'), expiresAt: field(raw, mapping, 'expires_at'),
      isActive: field(raw, mapping, 'is_active'), isVerified: field(raw, mapping, 'is_verified'),
      isExclusive: field(raw, mapping, 'is_exclusive'), productId: field(raw, mapping, 'product_id'), source: 'bulk_import',
    };
    const validation = validateCouponImportRow(input);
    const storeProblem = mapping.store && !store ? ['Store could not be resolved to one active store.'] : [];
    return { raw, rowNumber: index + 2, validation, storeProblem, storeResolution };
  });

  const fingerprints = prepared.map((row) => row.validation.duplicateFingerprint);
  const duplicateInFile = findDuplicateFingerprints(fingerprints);
  const storeIds = [...new Set(prepared.map((row) => row.validation.normalized.storeId).filter((id): id is string => Boolean(id)))];
  const { data: existingCoupons, error: existingError } = storeIds.length
    ? await supabase.from('coupons').select('id, store_id, code').in('store_id', storeIds)
    : { data: [], error: null };
  if (existingError) throw publicError('Existing coupons could not be checked. Try again.');
  const existingByFingerprint = new Map((existingCoupons ?? []).map((coupon) => [canonicalCouponFingerprint(coupon.store_id, coupon.code), coupon.id]));

  const stagedRows = prepared.map((row) => {
    const fingerprint = row.validation.duplicateFingerprint;
    const existingCouponId = fingerprint ? existingByFingerprint.get(fingerprint) ?? null : null;
    const errors = [...row.validation.errors, ...row.storeProblem.map((message) => ({ code: 'MISSING_STORE' as const, field: 'store', message }))];
    let status: CouponImportRowStatus = errors.length ? 'invalid' : 'valid';
    if (status === 'valid' && fingerprint && duplicateInFile.has(fingerprint)) status = 'duplicate_in_file';
    if (status === 'valid' && existingCouponId) status = 'duplicate_existing';
    const problems = errors.map((error) => error.message);
    if (status === 'duplicate_in_file') problems.push('Duplicate coupon code in this file.');
    if (status === 'duplicate_existing') problems.push('A coupon with this store and code already exists.');
    return {
      import_id: '', row_number: row.rowNumber, raw_data: row.raw, normalized_data: toDatabaseRow(row.validation),
      duplicate_fingerprint: fingerprint, status, errors, warnings: row.validation.warnings,
      existing_coupon_id: existingCouponId, preview: { ...preview(row.rowNumber, row.validation, status, problems), store: row.storeResolution.store?.name ?? row.storeResolution.sourceValue },
    };
  });

  const counts = stagedRows.reduce((result, row) => {
    result.total += 1;
    if (row.status === 'valid') result.valid += 1;
    else if (row.status === 'invalid') result.invalid += 1;
    else result.duplicates += 1;
    return result;
  }, { total: 0, valid: 0, invalid: 0, duplicates: 0, warnings: 0 });
  counts.warnings = stagedRows.filter((row) => row.warnings.length > 0).length;
  const sourceHash = createHash('sha256').update(bytes).digest('hex');
  const validationHash = createHash('sha256').update(JSON.stringify({ sourceHash, mapping, defaultStoreId: defaultStoreId ?? null, version: VALIDATION_VERSION })).digest('hex');

  const { data: batch, error: batchError } = await supabase.from('coupon_imports').insert({
    status: 'validated', source_file_name: file.name.slice(0, 255), source_file_hash: sourceHash, source_type: 'csv',
    mapping_snapshot: { mapping, defaultStoreId: defaultStoreId ?? null }, validation_version: VALIDATION_VERSION,
    validation_hash: validationHash, total_row_count: counts.total, valid_row_count: counts.valid,
    invalid_row_count: counts.invalid, duplicate_row_count: counts.duplicates, skipped_row_count: counts.duplicates,
    created_by: user.id, validated_at: new Date().toISOString(),
  }).select('id').single();
  if (batchError || !batch) throw publicError('The import could not be staged. Try again.');

  let rowsError: { message?: string } | null = null;
  for (let start = 0; start < stagedRows.length; start += stagingChunkSize) {
    const rows = stagedRows.slice(start, start + stagingChunkSize).map(({ preview: _preview, ...row }) => ({ ...row, import_id: batch.id }));
    const { error } = await supabase.from('coupon_import_rows').insert(rows);
    if (error) {
      rowsError = error;
      break;
    }
  }
  if (rowsError) {
    await supabase.from('coupon_imports').update({ status: 'failed', failed_at: new Date().toISOString(), failure_reason: 'Staging rows failed.' }).eq('id', batch.id);
    throw publicError('The import could not be staged. No coupons were imported.');
  }

  const resolutions = new Map<string, { sourceValue: string | null; status: CouponStoreResolution['status']; storeName: string | null; candidates: Array<{ id: string; name: string }>; reason: string; confidence: CouponStoreResolution['confidence']; rowCount: number }>();
  for (const row of prepared) {
    if (!mapping.store) continue;
    const key = row.storeResolution.normalizedValue ?? `missing:${row.rowNumber}`;
    const existing = resolutions.get(key);
    if (existing) {
      existing.rowCount += 1;
      continue;
    }
    resolutions.set(key, {
      sourceValue: row.storeResolution.sourceValue,
      status: row.storeResolution.status,
      storeName: row.storeResolution.store?.name ?? null,
      candidates: row.storeResolution.candidates.map((store) => ({ id: store.id, name: store.name })),
      reason: row.storeResolution.reason,
      confidence: row.storeResolution.confidence,
      rowCount: 1,
    });
  }

  return { importId: batch.id, validationHash, counts, preview: stagedRows.slice(0, previewLimit).map((row) => row.preview), storeResolutions: [...resolutions.values()] };
}

export async function commitStagedCouponImport(importId: string, validationHash: string) {
  const { supabase } = await requireCouponImportAdmin();
  const { data, error } = await supabase.rpc('commit_coupon_import', { p_import_id: importId, p_validation_hash: validationHash });
  if (error || !data?.ok) throw publicError('The import could not be committed. No coupons were imported.');
  return data as { ok: true; inserted_row_count: number };
}
