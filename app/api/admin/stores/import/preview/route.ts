import { NextResponse } from 'next/server';
import { AdminAuthError } from '@/utils/auth/admin';
import { previewStoreImport } from '@/lib/stores/import';
export const runtime = 'nodejs';
export async function POST(request: Request) { try { const data = await request.formData(); const file = data.get('file'); const mapping = JSON.parse(String(data.get('mapping') ?? '{}')); if (!(file instanceof File) || !mapping || Array.isArray(mapping)) return NextResponse.json({ error: 'Invalid import request.' }, { status: 400 }); return NextResponse.json(await previewStoreImport(file, mapping)); } catch (error) { return NextResponse.json({ error: error instanceof AdminAuthError ? 'Not authorized.' : 'The Store CSV could not be previewed.' }, { status: error instanceof AdminAuthError ? error.status : 400 }); } }
