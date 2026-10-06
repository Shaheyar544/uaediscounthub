const FALLBACK_MEDIA_BASE = 'https://pub-472731269a304e3caa5edd9544939ee9.r2.dev';

export function getMediaBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_MEDIA_URL?.trim();
  // If envUrl is media.uaediscounthub.com or empty, default to active public R2 dev endpoint
  if (!envUrl || envUrl.includes('media.uaediscounthub.com')) {
    return FALLBACK_MEDIA_BASE;
  }
  return envUrl.replace(/\/+$/, '');
}

/**
 * Resolves any image URL or storage key into a valid, fast, publicly accessible URL.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const clean = url.trim();
  if (!clean) return null;

  const mediaBase = getMediaBaseUrl();

  // If URL uses the old/unreachable media.uaediscounthub.com domain, swap to public R2
  if (clean.includes('media.uaediscounthub.com')) {
    return clean.replace(/^https?:\/\/media\.uaediscounthub\.com/, mediaBase);
  }

  // If it's already an absolute HTTP/HTTPS URL or root relative path
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/')) {
    return clean;
  }

  // If it starts with products/
  if (clean.startsWith('products/')) {
    return `${mediaBase}/${clean}`;
  }

  // If it's an image filename (e.g. 452_QL80_.jpg or hash-name.webp)
  return `${mediaBase}/products/${clean}`;
}
