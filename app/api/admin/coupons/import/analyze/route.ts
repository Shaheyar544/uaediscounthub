import { NextResponse } from 'next/server';
import { AdminAuthError } from '@/utils/auth/admin';
import { analyzeCouponImport } from '@/lib/coupons/import/service';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a CSV file.' }, { status: 400 });
    return NextResponse.json(await analyzeCouponImport(file));
  } catch (error) {
    const status = error instanceof AdminAuthError ? error.status : 400;
    return NextResponse.json({ error: error instanceof AdminAuthError ? 'Not authorized.' : 'The CSV could not be analyzed.' }, { status });
  }
}
