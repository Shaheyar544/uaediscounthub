import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Apple
      { protocol: 'https', hostname: 'store.storeimages.cdn-apple.com' },
      { protocol: 'https', hostname: '*.apple.com' },
      // Samsung
      { protocol: 'https', hostname: 'images.samsung.com' },
      { protocol: 'https', hostname: '*.samsung.com' },
      // Amazon (product images)
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: '*.amazon.ae' },
      // Noon
      { protocol: 'https', hostname: 'f.nooncdn.com' },
      { protocol: 'https', hostname: 'cdn.noon.com' },
      // Xiaomi
      { protocol: 'https', hostname: 'i01.appmifile.com' },
      { protocol: 'https', hostname: '*.mi.com' },
      // Supabase storage
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      // Wikimedia (store logos)
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      // Placeholder
      { protocol: 'https', hostname: 'placehold.co' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
  },
  compress: true,
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ],
      },
    ]
  },
};

export default nextConfig;
