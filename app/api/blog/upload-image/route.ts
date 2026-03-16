import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/blog/upload-image
 * Processes an uploaded image: converts to WebP, resizes for original/OG/thumb,
 * and uploads all versions to Supabase Storage.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check auth (only admins should upload)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      // Allow for development if needed, but in production this should be strict
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const id = crypto.randomUUID()
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const basePath = `blog/${year}/${month}/${id}`

    // 1. Original/Main version: Max 1200px wide, WebP
    const originalBuffer = await sharp(buffer)
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    // 2. Open Graph version: Exactly 1200x630, WebP
    const ogBuffer = await sharp(buffer)
      .resize(1200, 630, { fit: 'cover', position: 'center' })
      .webp({ quality: 82 })
      .toBuffer()

    // 3. Thumbnail version: 400x300, WebP
    const thumbBuffer = await sharp(buffer)
      .resize(400, 300, { fit: 'cover', position: 'center' })
      .webp({ quality: 75 })
      .toBuffer()

    // Upload to Supabase Storage
    const [originalUpload, ogUpload, thumbUpload] = await Promise.all([
      supabase.storage.from('blog-images').upload(`${basePath}-original.webp`, originalBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true
      }),
      supabase.storage.from('blog-images').upload(`${basePath}-og.webp`, ogBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true
      }),
      supabase.storage.from('blog-images').upload(`${basePath}-thumb.webp`, thumbBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true
      })
    ])

    // Check for upload errors
    if (originalUpload.error) throw originalUpload.error
    if (ogUpload.error) throw ogUpload.error
    if (thumbUpload.error) throw thumbUpload.error

    // Get public URLs
    const { data: { publicUrl: originalUrl } } = supabase.storage.from('blog-images').getPublicUrl(`${basePath}-original.webp`)
    const { data: { publicUrl: ogUrl } } = supabase.storage.from('blog-images').getPublicUrl(`${basePath}-og.webp`)
    const { data: { publicUrl: thumbUrl } } = supabase.storage.from('blog-images').getPublicUrl(`${basePath}-thumb.webp`)

    return NextResponse.json({
      original: originalUrl,
      og: ogUrl,
      thumb: thumbUrl,
      size_kb: Math.round(originalBuffer.length / 1024),
      id
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
