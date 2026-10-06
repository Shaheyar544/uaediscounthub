export type CouponDiscountType = 'percent' | 'fixed';

export type CouponImportRowStatus =
  | 'valid'
  | 'invalid'
  | 'duplicate_in_file'
  | 'duplicate_existing'
  | 'skipped';

export type CouponValidationIssueCode =
  | 'MISSING_STORE'
  | 'MISSING_CODE'
  | 'MISSING_TITLE'
  | 'INVALID_DISCOUNT_TYPE'
  | 'INVALID_DISCOUNT_VALUE'
  | 'PERCENTAGE_OUT_OF_RANGE'
  | 'FIXED_DISCOUNT_OUT_OF_RANGE'
  | 'INVALID_DATE'
  | 'EXPIRED_DATE'
  | 'INVALID_BOOLEAN'
  | 'INVALID_INTEGER'
  | 'INFERRED_DISCOUNT_TYPE';

export interface CouponValidationIssue {
  code: CouponValidationIssueCode;
  field: string;
  message: string;
}

export interface CouponImportRowInput {
  storeId?: unknown;
  code?: unknown;
  titleEn?: unknown;
  titleAr?: unknown;
  descriptionEn?: unknown;
  descriptionAr?: unknown;
  discountType?: unknown;
  discountTypeWasInferred?: boolean;
  discountValue?: unknown;
  minOrderValue?: unknown;
  maxUses?: unknown;
  expiresAt?: unknown;
  isActive?: unknown;
  isVerified?: unknown;
  isExclusive?: unknown;
  productId?: unknown;
  source?: unknown;
}

export interface NormalizedCouponImportRow {
  storeId: string | null;
  code: string | null;
  titleEn: string | null;
  titleAr: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  discountType: CouponDiscountType | null;
  discountValue: number | null;
  minOrderValue: number | null;
  maxUses: number | null;
  expiresAt: string | null;
  isActive: boolean | null;
  isVerified: boolean | null;
  isExclusive: boolean | null;
  productId: string | null;
  source: string | null;
}

export interface CouponImportValidationResult {
  status: Extract<CouponImportRowStatus, 'valid' | 'invalid'>;
  normalized: NormalizedCouponImportRow;
  duplicateFingerprint: string | null;
  errors: CouponValidationIssue[];
  warnings: CouponValidationIssue[];
}

export const couponImportFields = [
  'store', 'code', 'title_en', 'discount_type', 'discount_value', 'title_ar',
  'description_en', 'description_ar', 'min_order_value', 'max_uses',
  'expires_at', 'is_active', 'is_verified', 'is_exclusive', 'product_id',
] as const;

export type CouponImportField = typeof couponImportFields[number];
export type CouponColumnMapping = Partial<Record<CouponImportField, string>>;

export interface CouponImportPreviewRow {
  rowNumber: number;
  code: string | null;
  store: string | null;
  title: string | null;
  discount: string | null;
  expiresAt: string | null;
  status: CouponImportRowStatus;
  problems: string[];
  warnings: string[];
}
