import { NextResponse } from 'next/server';
import { AdminAuthError } from '@/utils/auth/admin';
import { reviewCouponStoreAlias } from '@/lib/coupons/import/store-aliases';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await reviewCouponStoreAlias({ aliasValue: body?.aliasValue, decision: body?.decision, storeId: body?.storeId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof AdminAuthError ? error.status : 400;
    return NextResponse.json({ error: error instanceof AdminAuthError ? 'Not authorized.' : 'The store alias could not be saved.' }, { status });
  }
}
