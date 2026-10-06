import { canonicalCouponFingerprint } from './duplicates';
import {
  normalizeCouponCode,
  normalizeDiscountType,
  normalizeOptionalText,
  hasExplicitCurrency,
  hasExplicitPercentage,
  parseBoolean,
  parseDate,
  parseDiscountValue,
  parseNonNegativeInteger,
} from './normalize';
import type {
  CouponImportRowInput,
  CouponImportValidationResult,
  CouponValidationIssue,
  NormalizedCouponImportRow,
} from './types';

const booleanFields = [
  ['isActive', 'isActive'],
  ['isVerified', 'isVerified'],
  ['isExclusive', 'isExclusive'],
] as const;

function addError(
  errors: CouponValidationIssue[],
  code: CouponValidationIssue['code'],
  field: string,
  message: string,
) {
  errors.push({ code, field, message });
}

export function validateCouponImportRow(
  input: CouponImportRowInput,
  now: Date = new Date(),
): CouponImportValidationResult {
  const errors: CouponValidationIssue[] = [];
  const warnings: CouponValidationIssue[] = [];
  const expiresAt = parseDate(input.expiresAt);
  const normalized: NormalizedCouponImportRow = {
    storeId: normalizeOptionalText(input.storeId),
    code: normalizeCouponCode(input.code),
    titleEn: normalizeOptionalText(input.titleEn),
    titleAr: normalizeOptionalText(input.titleAr),
    descriptionEn: normalizeOptionalText(input.descriptionEn),
    descriptionAr: normalizeOptionalText(input.descriptionAr),
    discountType: normalizeDiscountType(input.discountType),
    discountValue: parseDiscountValue(input.discountValue),
    minOrderValue: input.minOrderValue == null || input.minOrderValue === ''
      ? null
      : parseDiscountValue(input.minOrderValue),
    maxUses: input.maxUses == null || input.maxUses === '' ? null : parseNonNegativeInteger(input.maxUses),
    expiresAt,
    isActive: input.isActive == null || input.isActive === '' ? true : parseBoolean(input.isActive),
    isVerified: input.isVerified == null || input.isVerified === '' ? false : parseBoolean(input.isVerified),
    isExclusive: input.isExclusive == null || input.isExclusive === '' ? false : parseBoolean(input.isExclusive),
    productId: normalizeOptionalText(input.productId),
    source: normalizeOptionalText(input.source),
  };

  if (!normalized.storeId) addError(errors, 'MISSING_STORE', 'storeId', 'A store is required.');
  if (!normalized.code) addError(errors, 'MISSING_CODE', 'code', 'A coupon code is required.');
  if (!normalized.titleEn) addError(errors, 'MISSING_TITLE', 'titleEn', 'An English title is required.');
  if (!normalized.discountType) {
    addError(errors, 'INVALID_DISCOUNT_TYPE', 'discountType', 'Discount type must be percent or fixed.');
  }
  if (normalized.discountValue == null || normalized.discountValue <= 0) {
    addError(errors, 'INVALID_DISCOUNT_VALUE', 'discountValue', 'Discount value must be greater than zero.');
  }
  if (normalized.discountType === 'percent' && normalized.discountValue != null && normalized.discountValue > 100) {
    addError(errors, 'PERCENTAGE_OUT_OF_RANGE', 'discountValue', 'Percentage discounts cannot exceed 100.');
  }
  if (normalized.discountType === 'percent' && hasExplicitCurrency(input.discountValue)) {
    addError(errors, 'INVALID_DISCOUNT_VALUE', 'discountValue', 'A percentage discount cannot use a currency value.');
  }
  if (normalized.discountType === 'fixed' && hasExplicitPercentage(input.discountValue)) {
    addError(errors, 'INVALID_DISCOUNT_VALUE', 'discountValue', 'A fixed discount cannot use a percentage value.');
  }
  if (normalized.discountType === 'fixed' && normalized.discountValue != null && normalized.discountValue <= 0) {
    addError(errors, 'FIXED_DISCOUNT_OUT_OF_RANGE', 'discountValue', 'Fixed discounts must be greater than zero.');
  }
  if (input.minOrderValue != null && input.minOrderValue !== '' && normalized.minOrderValue == null) {
    addError(errors, 'INVALID_DISCOUNT_VALUE', 'minOrderValue', 'Minimum order value must be a non-negative number.');
  }
  if (normalized.minOrderValue != null && normalized.minOrderValue < 0) {
    addError(errors, 'INVALID_DISCOUNT_VALUE', 'minOrderValue', 'Minimum order value must be non-negative.');
  }
  if (input.maxUses != null && input.maxUses !== '' && normalized.maxUses == null) {
    addError(errors, 'INVALID_INTEGER', 'maxUses', 'Maximum uses must be a non-negative integer.');
  }
  if (input.expiresAt != null && input.expiresAt !== '' && !expiresAt) {
    addError(errors, 'INVALID_DATE', 'expiresAt', 'Expiration date must be ISO-8601 formatted.');
  }
  if (expiresAt && new Date(expiresAt).getTime() <= now.getTime()) {
    addError(errors, 'EXPIRED_DATE', 'expiresAt', 'Expiration date must be in the future.');
  }

  for (const [inputField, normalizedField] of booleanFields) {
    if (input[inputField] != null && input[inputField] !== '' && normalized[normalizedField] == null) {
      addError(errors, 'INVALID_BOOLEAN', inputField, 'Boolean values must be true/false, yes/no, or 1/0.');
    }
  }

  if (input.discountTypeWasInferred && normalized.discountType) {
    warnings.push({
      code: 'INFERRED_DISCOUNT_TYPE',
      field: 'discountType',
      message: `Discount type was inferred as ${normalized.discountType} from the discount value.`,
    });
  }

  return {
    status: errors.length === 0 ? 'valid' : 'invalid',
    normalized,
    duplicateFingerprint: canonicalCouponFingerprint(normalized.storeId, normalized.code),
    errors,
    warnings,
  };
}
