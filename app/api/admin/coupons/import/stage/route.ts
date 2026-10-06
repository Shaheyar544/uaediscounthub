import { NextResponse } from 'next/server';
import { AdminAuthError } from '@/utils/auth/admin';
import { stageCouponImport } from '@/lib/coupons/import/service';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get('file');
    const mapping = JSON.parse(String(data.get('mapping') ?? '{}'));
    if (!(file instanceof File) || !mapping || Array.isArray(mapping)) return NextResponse.json({ error: 'Invalid import request.' }, { status: 400 });
    return NextResponse.json(await stageCouponImport({ file, mapping, defaultStoreId: String(data.get('defaultStoreId') ?? '') || null }));
  } catch (error) {
    const status = error instanceof AdminAuthError ? error.status : 400;
    return NextResponse.json({ error: error instanceof AdminAuthError ? 'Not authorized.' : 'The import could not be validated.' }, { status });
  }
}
