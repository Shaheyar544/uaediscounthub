import { parse } from 'csv-parse/sync';

export const CSV_MAX_BYTES = 5 * 1024 * 1024;
export const CSV_MAX_ROWS = 10_000;
export const CSV_MAX_COLUMNS = 60;
export const CSV_MAX_CELL_LENGTH = 10_000;

export class CouponCsvError extends Error {}

export interface ParsedCouponCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCouponCsv(bytes: Uint8Array): ParsedCouponCsv {
  if (bytes.byteLength === 0) throw new CouponCsvError('The CSV file is empty.');
  if (bytes.byteLength > CSV_MAX_BYTES) throw new CouponCsvError('CSV files must be 5 MB or smaller.');
  if (bytes.includes(0) || (bytes[0] === 0x50 && bytes[1] === 0x4b)) {
    throw new CouponCsvError('Only UTF-8 CSV files are supported.');
  }

  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new CouponCsvError('The CSV must be UTF-8 encoded.');
  }

  try {
    const records = parse(text, {
      bom: true, columns: false, skip_empty_lines: true, relax_column_count: false,
      max_record_size: CSV_MAX_CELL_LENGTH, to: CSV_MAX_ROWS + 1,
    }) as string[][];
    if (records.length < 2) throw new CouponCsvError('The CSV must contain a header row and at least one data row.');
    const headers = records[0].map((header) => header.trim());
    if (headers.length === 0 || headers.length > CSV_MAX_COLUMNS || headers.some((header) => !header)) {
      throw new CouponCsvError('The CSV headers are invalid.');
    }
    if (new Set(headers.map((header) => header.toLocaleLowerCase())).size !== headers.length) {
      throw new CouponCsvError('CSV headers must be unique.');
    }
    if (records.length - 1 > CSV_MAX_ROWS) throw new CouponCsvError('CSV files may contain at most ' + CSV_MAX_ROWS.toLocaleString() + ' rows.');
    return { headers, rows: records.slice(1).map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? '']))) };
  } catch (error) {
    if (error instanceof CouponCsvError) throw error;
    throw new CouponCsvError('The CSV is malformed. Check quotes and column counts, then try again.');
  }
}

export function suggestCouponColumnMapping(headers: string[]) {
  const aliases: Record<string, string[]> = {
    store: ['store', 'store name', 'merchant', 'merchant name', 'retailer', 'brand'],
    code: ['code', 'coupon code', 'promo code', 'promotion code', 'voucher code', 'discount code'],
    title_en: ['title', 'coupon title', 'title en', 'english title', 'offer', 'deal', 'description', 'offer title'],
    discount_type: ['discount type', 'type', 'offer type', 'discount kind'],
    discount_value: ['discount', 'discount value', 'discount amount', 'offer value', 'value', 'amount'],
    title_ar: ['title ar', 'arabic title'], description_en: ['description en', 'english description'],
    description_ar: ['description ar', 'arabic description'], min_order_value: ['min order', 'minimum order', 'min spend'],
    max_uses: ['max uses', 'maximum uses'], expires_at: ['expiry', 'expiry date', 'expiration', 'expires at', 'end date', 'valid until'],
    is_active: ['active', 'is active'], is_verified: ['verified', 'is verified'],
    is_exclusive: ['exclusive', 'is exclusive'], product_id: ['product id'],
  };
  const normalized = new Map<string, string[]>();
  for (const header of headers) {
    const key = normalizeHeader(header);
    const matches = normalized.get(key) ?? [];
    matches.push(header);
    normalized.set(key, matches);
  }

  const usedHeaders = new Set<string>();
  const suggestions: Record<string, string> = {};
  for (const [field, names] of Object.entries(aliases)) {
    const candidates = names.flatMap((name) => normalized.get(normalizeHeader(name)) ?? []);
    const uniqueCandidates = [...new Set(candidates)].filter((header) => !usedHeaders.has(header));
    if (uniqueCandidates.length === 1) {
      suggestions[field] = uniqueCandidates[0];
      usedHeaders.add(uniqueCandidates[0]);
    }
  }
  return suggestions;
}

function normalizeHeader(value: string) {
  return value.toLocaleLowerCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
}
