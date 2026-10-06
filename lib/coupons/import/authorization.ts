import 'server-only';

import { requireAdmin } from '@/utils/auth/require-admin';

/**
 * Server entrypoints for coupon imports must use this before accessing staged
 * import data or invoking an import RPC.
 */
export async function requireCouponImportAdmin() {
  return requireAdmin();
}
