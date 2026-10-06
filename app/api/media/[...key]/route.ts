import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'uaediscounthub-media';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await params;
    const objectKey = key.join('/');

    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
    });

    const response = await R2.send(command);

    if (!response.Body) {
      return new NextResponse('Image not found in storage', { status: 404 });
    }

    const byteArray = await response.Body.transformToByteArray();
    const contentType = response.ContentType || 'image/webp';

    return new NextResponse(Buffer.from(byteArray), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': byteArray.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('[API /api/media] Failed to fetch image from R2:', error?.message);
    return new NextResponse('Image not found', { status: 404 });
  }
}
