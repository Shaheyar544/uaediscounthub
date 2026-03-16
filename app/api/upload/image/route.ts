import { uploadImage, deleteByKey } from '@/lib/r2-storage';
import { createAdminClient } from '@/utils/supabase/admin';
import sharp from 'sharp';

export async function POST(request: Request) {
  let uploadedKey: string | null = null;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return Response.json({ error: 'Only JPEG, PNG and WebP allowed' }, { status: 400 });
    }

    // High-res source processing limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: 'Maximum source file size is 10MB' }, { status: 400 });
    }

    let buffer = Buffer.from(await file.arrayBuffer());
    
    // Step 1: Optimize and Convert to WebP using sharp
    try {
      buffer = await sharp(buffer)
        .resize({ 
          width: 1200, 
          withoutEnlargement: true, 
          fit: 'inside' 
        })
        .webp({ quality: 80, effort: 6 }) 
        .toBuffer();
    } catch (sharpError) {
      console.error('[Sharp] Conversion error:', sharpError);
      return Response.json({ error: 'Failed to process image' }, { status: 422 });
    }

    // Prepare filename
    const originalName = file.name.includes('.') 
      ? file.name.substring(0, file.name.lastIndexOf('.'))
      : file.name;
    const newFileName = `${originalName || 'upload'}.webp`;

    // Step 2: Upload to Cloudflare R2
    const r2Result = await uploadImage(buffer, newFileName, 'image/webp');
    uploadedKey = r2Result.key;

    // Step 3: Synchronize with Supabase Assets table using Admin Client (Bypass RLS)
    const supabaseAdmin = createAdminClient();
    const assetPayload = {
      file_name: newFileName,
      public_url: r2Result.url,
      file_size: buffer.length, // Size of the compressed buffer
      mime_type: 'image/webp',
      bucket_name: r2Result.bucket,
      storage_key: r2Result.key
    };

    const { data: asset, error: dbError } = await supabaseAdmin
      .from('assets')
      .insert(assetPayload)
      .select()
      .single();

    if (dbError) {
      // Step 4: Cleanup R2 if DB fails
      console.error('❌ [Supabase Sync Failure]:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code
      });

      if (uploadedKey) {
        await deleteByKey(uploadedKey);
        console.log('🧹 [R2 Cleanup] Removed orphaned object:', uploadedKey);
      }

      return Response.json({ 
        error: `Database sync failed: ${dbError.message}`,
        details: dbError.details 
      }, { status: 500 });
    }

    console.log('[Sync] Asset created successfully (Bypass RLS):', asset.id);
    return Response.json({ url: r2Result.url, id: asset.id });

  } catch (error: any) {
    console.error('[Upload Pipeline] Error:', error.message);
    
    if (uploadedKey) {
      await deleteByKey(uploadedKey).catch(err => console.error('[R2] Emergency cleanup failed:', err));
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
}
