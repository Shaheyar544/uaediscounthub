import { NextResponse } from 'next/server';
import { AdminAuthError } from '@/utils/auth/admin';
import { commitStagedCouponImport } from '@/lib/coupons/import/service';

export async function POST(request: Request, { params }: { params: Promise<{ importId: string }> }) {
  try {
    const { importId } = await params;
    const body = await request.json() as { validationHash?: string };
    if (!body.validationHash) return NextResponse.json({ error: 'Invalid import request.' }, { status: 400 });
    return NextResponse.json(await commitStagedCouponImport(importId, body.validationHash));
  } catch (error) {
    const status = error instanceof AdminAuthError ? error.status : 400;
    return NextResponse.json({ error: error instanceof AdminAuthError ? 'Not authorized.' : 'The import could not be committed. No coupons were imported.' }, { status });
  }
}
