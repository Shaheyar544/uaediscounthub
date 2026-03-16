import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

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

export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}
