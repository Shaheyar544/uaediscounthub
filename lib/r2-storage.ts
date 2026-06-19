import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

if (typeof window !== 'undefined') {
  throw new Error('R2-Storage utility can only be used in Server-Side environments.');
}

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.NEXT_PUBLIC_MEDIA_URL!;

export interface R2UploadResult {
  url: string;
  key: string;
  bucket: string;
}

export async function uploadImage(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<R2UploadResult> {
  // Sanitize name but preserve extension (e.g. "my image.jpg" -> "my-image.webp")
  const extMatch = fileName.match(/\.([a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[0] : '.webp';
  const nameOnly = fileName.replace(/\.[a-z0-9]+$/i, '');
  
  const sanitized = nameOnly
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-') // collapse multiple dashes
    .replace(/^-|-$/g, ''); // trim dashes

  const key = `products/${Date.now()}-${sanitized}${ext}`;

  await R2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000',
  }));

  return {
    url: `${PUBLIC_URL}/${key}`,
    key,
    bucket: BUCKET
  };
}

export async function deleteByKey(key: string): Promise<void> {
  await R2.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key
  }));
}

export async function deleteImage(imageUrl: string): Promise<void> {
  const key = imageUrl.replace(`${PUBLIC_URL}/`, '');
  await deleteByKey(key);
}

export async function uploadRemoteImage(
  url: string,
  fileName: string
): Promise<R2UploadResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch remote image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  let buffer = Buffer.from(new Uint8Array(arrayBuffer));

  // Optimize with Sharp
  const processedBuffer = await sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true, fit: 'inside' })
    .webp({ quality: 80, effort: 6 })
    .toBuffer();

  return uploadImage(processedBuffer, fileName, 'image/webp');
}

export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}
