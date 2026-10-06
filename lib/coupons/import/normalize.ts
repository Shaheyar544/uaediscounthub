import type { CouponDiscountType } from './types';

function optionalText(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function compactWhitespace(value: string) {
  return value.replace(/[\s\u00a0]+/g, ' ').trim();
}

export function normalizeCouponCode(value: unknown): string | null {
  const text = optionalText(value);
  return text ? text.toUpperCase() : null;
}

export function normalizeDiscountType(value: unknown): CouponDiscountType | null {
  const text = optionalText(value)?.toLowerCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ');
  if (!text) return null;

  if (['percent', 'percentage', '%', 'pct', 'percent off', 'percentage off'].includes(text)) return 'percent';
  if (['fixed', 'amount', 'flat', 'aed', 'currency', 'cash', 'amount off', 'aed off'].includes(text)) return 'fixed';

  return null;
}

export function inferDiscountTypeFromValue(value: unknown): CouponDiscountType | null {
  if (typeof value !== 'string') return null;
  const text = compactWhitespace(value).toLowerCase();
  if (!text) return null;
  if (/%|\b(?:percent|percentage|pct)\b/.test(text)) return 'percent';
  if (/(?:\baed\b|\bdhs?\b|د\.?\s*إ)/i.test(text)) return 'fixed';
  return null;
}

export function hasExplicitPercentage(value: unknown) {
  return typeof value === 'string' && /%|\b(?:percent|percentage|pct)\b/i.test(value);
}

export function hasExplicitCurrency(value: unknown) {
  return typeof value === 'string' && /(?:\baed\b|\bdhs?\b|د\.?\s*إ)/i.test(value);
}

export function parseDiscountValue(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const compact = compactWhitespace(value).replace(/,/g, '');
  const numericText = compact
    .replace(/(?:\baed\b|\bdhs?\b|د\.?\s*إ|%|\bpercent(?:age)?\b|\bpct\b)/gi, '')
    .trim();
  if (!/^\d+(?:\.\d+)?$/.test(numericText)) return null;

  const numeric = Number.parseFloat(numericText);
  return Number.isFinite(numeric) ? numeric : null;
}

export function parseNonNegativeInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return value;
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) return null;

  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function parseDate(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(`${trimmed}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== trimmed
      ? null
      : date.toISOString();
  }

  const numericDate = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (numericDate) {
    const first = Number(numericDate[1]);
    const second = Number(numericDate[2]);
    const year = Number(numericDate[3]);
    if (first > 12 && second <= 12) return toUtcDate(year, second, first);
    if (second > 12 && first <= 12) return toUtcDate(year, first, second);
    return null;
  }

  const yearFirst = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (yearFirst) return toUtcDate(Number(yearFirst[1]), Number(yearFirst[2]), Number(yearFirst[3]));

  const namedDate = trimmed.match(/^(\d{1,2})\s+([a-z]{3,9})\s+(\d{4})$/i)
    ?? trimmed.match(/^([a-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/i);
  if (namedDate) {
    const dayFirst = /^\d/.test(trimmed);
    const day = Number(namedDate[dayFirst ? 1 : 2]);
    const month = monthNumber(namedDate[dayFirst ? 2 : 1]);
    const year = Number(namedDate[3]);
    return month ? toUtcDate(year, month, day) : null;
  }

  if (!/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toUtcDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day
    ? null
    : date.toISOString();
}

function monthNumber(value: string): number | null {
  const month = value.toLowerCase().slice(0, 3);
  const index = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(month);
  return index === -1 ? null : index + 1;
}

export function parseBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return null;
}

export function normalizeOptionalText(value: unknown): string | null {
  return optionalText(value);
}
