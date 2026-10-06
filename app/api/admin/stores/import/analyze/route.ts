import { NextResponse } from 'next/server';
import { AdminAuthError } from '@/utils/auth/admin';
import { analyzeStoreImport } from '@/lib/stores/import';
export const runtime = 'nodejs';
export async function POST(request: Request) { try { const file = (await request.formData()).get('file'); if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a CSV file.' }, { status: 400 }); return NextResponse.json(await analyzeStoreImport(file)); } catch (error) { return NextResponse.json({ error: error instanceof AdminAuthError ? 'Not authorized.' : 'The Store CSV could not be analyzed.' }, { status: error instanceof AdminAuthError ? error.status : 400 }); } }
