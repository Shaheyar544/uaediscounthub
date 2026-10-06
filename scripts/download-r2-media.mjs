import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

function readEnvFile(path) {
  const env = {};
  const content = readFileSync(path, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;

    const [, key, value] = match;
    env[key] = value.replace(/^['"]|['"]$/g, '');
  }

  return env;
}

const env = readEnvFile(join(process.cwd(), '.env.local'));
const bucketName = env.R2_BUCKET_NAME;
const outputDir = join(process.cwd(), 'exports', 'r2');
mkdirSync(outputDir, { recursive: true });

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_KEY,
  },
});

const manifest = {
  exportedAt: new Date().toISOString(),
  bucket: bucketName,
  objectCount: 0,
  objects: [],
};

let continuationToken;

do {
  const listResponse = await client.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
      ContinuationToken: continuationToken,
    })
  );

  for (const object of listResponse.Contents ?? []) {
    if (!object.Key) continue;

    const targetPath = join(outputDir, object.Key);
    mkdirSync(dirname(targetPath), { recursive: true });

    const getResponse = await client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: object.Key,
      })
    );

    const bytes = await getResponse.Body.transformToByteArray();
    writeFileSync(targetPath, bytes);

    manifest.objectCount += 1;
    manifest.objects.push({
      key: object.Key,
      size: object.Size ?? 0,
      lastModified: object.LastModified?.toISOString?.() ?? null,
    });

    console.log(`Downloaded ${object.Key} (${object.Size ?? 0} bytes)`);
  }

  continuationToken = listResponse.IsTruncated
    ? listResponse.NextContinuationToken
    : undefined;
} while (continuationToken);

writeFileSync(
  join(outputDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf8'
);

console.log(`Downloaded ${manifest.objectCount} objects from ${bucketName}`);
