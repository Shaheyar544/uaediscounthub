import assert from 'node:assert/strict';
import test from 'node:test';

import { canonicalCouponFingerprint, findDuplicateFingerprints } from '../lib/coupons/import/duplicates';
import {
  inferDiscountTypeFromValue,
  normalizeCouponCode,
  parseBoolean,
  parseDate,
  parseDiscountValue,
} from '../lib/coupons/import/normalize';
import { parseCouponCsv, suggestCouponColumnMapping } from '../lib/coupons/import/parse';
import { createCouponImportSampleCsv } from '../lib/coupons/import/sample';
import { createCouponImportStoreSlug, normalizeStoreDomain, resolveCouponImportStore, resolveCouponImportStoreDetail } from '../lib/coupons/import/stores';
import { couponImportFields } from '../lib/coupons/import/types';
import { validateCouponImportRow } from '../lib/coupons/import/validate';
import { createStoreImportSampleCsv } from '../lib/stores/import-sample';

const storeId = 'D0E7C81E-AECF-4BFD-B99F-C372D8BA0060';
const tomorrow = '2030-01-02';

test('normalizes coupon codes with trim and uppercase semantics', () => {
  assert.equal(normalizeCouponCode('  save10  '), 'SAVE10');
  assert.equal(normalizeCouponCode('  café  '), 'CAFÉ');
  assert.equal(normalizeCouponCode('   '), null);
});

test('builds a canonical duplicate fingerprint and identifies in-file duplicates', () => {
  assert.equal(canonicalCouponFingerprint(storeId, ' save10 '), `${storeId.toLowerCase()}:SAVE10`);
  assert.equal(canonicalCouponFingerprint('', 'save10'), null);

  const duplicates = findDuplicateFingerprints([
    canonicalCouponFingerprint(storeId, 'save10'),
    canonicalCouponFingerprint(storeId.toLowerCase(), ' SAVE10 '),
    canonicalCouponFingerprint(storeId, 'new20'),
  ]);
  assert.deepEqual([...duplicates], [`${storeId.toLowerCase()}:SAVE10`]);
});

test('parses valid discount values and rejects malformed values', () => {
  assert.equal(parseDiscountValue('15%'), 15);
  assert.equal(parseDiscountValue('AED 25.50'), 25.5);
  assert.equal(parseDiscountValue('1,000'), 1000);
  assert.equal(parseDiscountValue('د.إ 25'), 25);
  assert.equal(parseDiscountValue('Dhs 25'), 25);
  assert.equal(parseDiscountValue('free'), null);
  assert.equal(parseDiscountValue('-10'), null);
});

test('parses ISO and unambiguous common affiliate date formats', () => {
  assert.equal(parseDate('2030-02-03'), '2030-02-03T00:00:00.000Z');
  assert.equal(parseDate('31/12/2030'), '2030-12-31T00:00:00.000Z');
  assert.equal(parseDate('12/31/2030'), '2030-12-31T00:00:00.000Z');
  assert.equal(parseDate('31 Dec 2030'), '2030-12-31T00:00:00.000Z');
  assert.equal(parseDate('Dec 31, 2030'), '2030-12-31T00:00:00.000Z');
  assert.equal(parseDate('03/02/2030'), null);
  assert.equal(parseDate('2030-02-30'), null);
});

test('infers discount type only from explicit percent or currency markers', () => {
  assert.equal(inferDiscountTypeFromValue('15%'), 'percent');
  assert.equal(inferDiscountTypeFromValue('AED 25'), 'fixed');
  assert.equal(inferDiscountTypeFromValue('10'), null);
});

test('matches safe affiliate aliases and leaves ambiguous title choices unmapped', () => {
  const mapping = suggestCouponColumnMapping(['Merchant Name', 'Promotion Code', 'Coupon Title', 'Offer Value', 'Valid Until']);
  assert.deepEqual(mapping, {
    store: 'Merchant Name', code: 'Promotion Code', title_en: 'Coupon Title', discount_value: 'Offer Value', expires_at: 'Valid Until',
  });
  assert.equal(suggestCouponColumnMapping(['Title', 'Coupon Title']).title_en, undefined);
});

test('creates a UTF-8 sample CSV with canonical fields and safe supported examples', () => {
  const sample = createCouponImportSampleCsv();
  const parsed = parseCouponCsv(new TextEncoder().encode(sample));

  assert.equal(sample.charCodeAt(0), 0xfeff);
  assert.deepEqual(parsed.headers, couponImportFields);
  assert.equal(parsed.rows.length, 3);
  assert.deepEqual(parsed.rows.map((row) => row.code), ['TESTPERCENT15', 'TESTAED25', 'TESTPERCENT20']);
  assert.deepEqual(parsed.rows.map((row) => row.discount_type), ['percent', 'fixed', 'percent']);
  assert.deepEqual(parsed.rows.map((row) => row.expires_at), ['2099-12-31', '2099-12-31', '2099-12-31']);
  assert.ok(parsed.rows.every((row) => row.store === 'Example Store UAE'));
});

test('creates a Store CSV template with the required verified-url fields', () => {
  const parsed = parseCouponCsv(new TextEncoder().encode(createStoreImportSampleCsv()));
  assert.equal(parsed.headers[0], 'name');
  assert.ok(parsed.headers.includes('base_url'));
  assert.equal(parsed.rows.length, 2);
  assert.ok(parsed.rows.every((row) => row.base_url.startsWith('https://')));
});

test('resolves store identities only by exact normalized name, slug, or id', () => {
  const stores = [
    { id: storeId, name: 'Amazon UAE', slug: 'amazon-ae' },
    { id: 'B', name: 'Amazon Marketplace', slug: 'amazon-marketplace' },
  ];
  assert.equal(resolveCouponImportStore('  amazon   uae ', stores)?.id, storeId);
  assert.equal(resolveCouponImportStore('amazon_ae', stores)?.id, storeId);
  assert.equal(resolveCouponImportStore('amazon', stores), null);
  assert.equal(resolveCouponImportStore('Same Store', [
    { id: 'C', name: 'Same Store', slug: 'same-store-one' },
    { id: 'D', name: 'same_store', slug: 'same-store-two' },
  ]), null);
});

test('resolves only deterministic UAE, domain, and approved-alias variants', () => {
  const stores = [
    { id: storeId, name: 'Noon', slug: 'noon', websiteUrl: 'https://www.noon.com/uae-en/' },
    { id: 'B', name: 'Sharaf DG', slug: 'sharaf-dg', websiteUrl: 'https://www.sharafdg.com/' },
  ];
  assert.equal(resolveCouponImportStoreDetail('Noon UAE', stores).store?.id, storeId);
  assert.equal(resolveCouponImportStoreDetail('www.sharafdg.com/offers', stores).store?.id, 'B');
  assert.equal(normalizeStoreDomain('https://www.noon.com/uae-en/?ref=affiliate'), 'noon.com');
  assert.equal(resolveCouponImportStoreDetail('noon partner label', stores, [{
    aliasValue: 'Noon Partner Label', normalizedAlias: 'noon partner label', store: stores[0],
  }]).store?.id, storeId);
  assert.equal(resolveCouponImportStoreDetail('Noon Marketplace', stores).status, 'new_store_candidate');
});

test('refuses ambiguous deterministic matches and sends them to review', () => {
  const stores = [
    { id: storeId, name: 'Same Store', slug: 'same-store-one' },
    { id: 'B', name: 'same_store', slug: 'same-store-two' },
  ];
  const detail = resolveCouponImportStoreDetail('same store', stores);
  assert.equal(detail.status, 'needs_review');
  assert.equal(detail.store, null);
  assert.equal(detail.candidates.length, 2);
});

test('generates safe deterministic candidate-store slugs without inventing non-ASCII identifiers', () => {
  assert.equal(createCouponImportStoreSlug('H&M UAE'), 'h-and-m-uae');
  assert.equal(createCouponImportStoreSlug("Bloomingdale's UAE"), 'bloomingdales-uae');
  assert.equal(createCouponImportStoreSlug('   '), null);
  assert.equal(createCouponImportStoreSlug('متجر'), null);
});

test('parses supported boolean forms and rejects malformed values', () => {
  assert.equal(parseBoolean('yes'), true);
  assert.equal(parseBoolean('0'), false);
  assert.equal(parseBoolean(1), true);
  assert.equal(parseBoolean('perhaps'), null);
});

test('rejects missing required fields', () => {
  const result = validateCouponImportRow({
    discountType: 'percent',
    discountValue: '10',
  }, new Date('2030-01-01T00:00:00.000Z'));

  assert.equal(result.status, 'invalid');
  assert.deepEqual(result.errors.map((error) => error.code), [
    'MISSING_STORE',
    'MISSING_CODE',
    'MISSING_TITLE',
  ]);
});

test('enforces percentage and fixed-discount limits', () => {
  const overPercentage = validateCouponImportRow({
    storeId,
    code: 'BIG',
    titleEn: 'Big discount',
    discountType: 'percentage',
    discountValue: '101',
    expiresAt: tomorrow,
  }, new Date('2030-01-01T00:00:00.000Z'));
  assert.equal(overPercentage.status, 'invalid');
  assert.ok(overPercentage.errors.some((error) => error.code === 'PERCENTAGE_OUT_OF_RANGE'));

  const invalidFixed = validateCouponImportRow({
    storeId,
    code: 'ZERO',
    titleEn: 'Zero discount',
    discountType: 'fixed',
    discountValue: '0',
    expiresAt: tomorrow,
  }, new Date('2030-01-01T00:00:00.000Z'));
  assert.equal(invalidFixed.status, 'invalid');
  assert.ok(invalidFixed.errors.some((error) => error.code === 'FIXED_DISCOUNT_OUT_OF_RANGE'));
});

test('rejects invalid, expired, and malformed optional field values', () => {
  const result = validateCouponImportRow({
    storeId,
    code: 'SAVE10',
    titleEn: 'Save 10',
    discountType: 'fixed',
    discountValue: '10',
    expiresAt: '2029-12-31',
    isActive: 'sometimes',
  }, new Date('2030-01-01T00:00:00.000Z'));

  assert.equal(result.status, 'invalid');
  assert.ok(result.errors.some((error) => error.code === 'EXPIRED_DATE'));
  assert.ok(result.errors.some((error) => error.code === 'INVALID_BOOLEAN'));
});

test('supports Arabic and English text, empty optional fields, and explicit inferred-discount warnings', () => {
  const result = validateCouponImportRow({
    storeId,
    code: '  save 20 ',
    titleEn: 'Save on أجهزة',
    titleAr: 'وفر على الأجهزة',
    descriptionEn: '',
    discountType: 'percent',
    discountTypeWasInferred: true,
    discountValue: '20%',
    expiresAt: '31/12/2030',
  }, new Date('2030-01-01T00:00:00.000Z'));

  assert.equal(result.status, 'valid');
  assert.equal(result.normalized.code, 'SAVE 20');
  assert.equal(result.normalized.descriptionEn, null);
  assert.ok(result.warnings.some((warning) => warning.code === 'INFERRED_DISCOUNT_TYPE'));
});

test('treats a canonical existing-coupon key as a duplicate in a database lookup unit scenario', () => {
  const existing = new Set([canonicalCouponFingerprint(storeId, 'SAVE10')]);
  assert.ok(existing.has(canonicalCouponFingerprint(storeId, ' save10 ')));
});
