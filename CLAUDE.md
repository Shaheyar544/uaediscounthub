# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test suite is configured. There is no test command.

**Production deployment** uses PM2:
```bash
pm2 start ecosystem.config.js   # Start with cluster mode
pm2 save                         # Persist process list
```

## Architecture Overview

**UAE Discount Hub** is a Next.js 16 App Router price-comparison/coupon platform targeting GCC markets (UAE, KSA, Qatar). All routes are namespaced under `app/[locale]/` to support English and Arabic.

### Routing & i18n

- All public and admin pages live under `app/[locale]/` (locale = `en` | `ar`)
- `middleware.ts` handles locale detection and redirects, plus Supabase session refresh
- `i18n/dictionaries.ts` loads JSON translation files (`i18n/en.json`, `i18n/ar.json`) server-side
- Server components call `getDictionary(locale)` to get translated strings

### Data Layer (Supabase)

All database access goes through Supabase (PostgreSQL). Three client variants exist:

| File | Used in | Purpose |
|------|---------|---------|
| `utils/supabase/server.ts` | Server components, API routes | SSR client with session cookies |
| `utils/supabase/client.ts` | Client components | Browser client |
| `utils/supabase/admin.ts` | Admin API routes | Service role (bypasses RLS) |

Key tables: `stores`, `products`, `product_prices` (price history), `coupons`, `categories`, `blog_posts`, `blog_post_tags`, `pages` (CMS), `newsletter_subscribers`, `users`.

Authentication uses Supabase Auth with JWT. Admin access is gated by `app_metadata.role === 'admin'` checked server-side in API handlers.

### API Routes (`app/api/`)

RESTful handlers for: `blog/`, `amazon/` (Product Advertising API), `coupons/`, `alerts/` (WhatsApp via Twilio), `admin/`, `upload/` (Cloudflare R2), `revalidate/` (ISR cache busting), `auth/` (Supabase OAuth callback + signout).

### External Integrations

- **DeepSeek AI** (`utils/ai/deepseek.ts`) — product pros/cons, blog summaries
- **Anthropic Claude** (`@anthropic-ai/sdk`) — blog AI assistance (`app/api/blog/`)
- **Amazon PAAPI** (`lib/amazon-paapi.ts`) — product search/lookup
- **Cloudflare R2** (`lib/r2-storage.ts`) — image storage (S3-compatible via `@aws-sdk/client-s3`)
- **PostHog** (`components/analytics/AnalyticsProvider.tsx`) — product analytics
- **Resend** — transactional email
- **Twilio** — WhatsApp price-drop alerts

### Component Organization

- `components/ui/` — shadcn/ui base components (configured for `base-nova` style)
- `components/layout/` — Navbar, Footer, FlashBanner
- `components/admin/` — Admin dashboard components (sidebar, editors, image upload)
- `components/blog/` — Tiptap-based PostEditor, BlogCard, SEOChecklist, etc.
- All other subdirs are feature-scoped (home, product, search, coupons, seo)

### Rendering Strategy

- Server Components are the default; use `"use client"` only for interactivity
- Home page uses `export const dynamic = 'force-dynamic'` for fresh data
- ISR revalidation via `/api/revalidate/` endpoints
- `hooks/use-has-mounted.ts` guards hydration-sensitive renders

### Environment Variables

Required — validate at startup via `utils/env-validation.ts`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DEEPSEEK_API_KEY
NEXT_PUBLIC_POSTHOG_KEY / NEXT_PUBLIC_POSTHOG_HOST
NEXT_PUBLIC_APP_URL
CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_R2_ACCESS_KEY / CLOUDFLARE_R2_SECRET_KEY / R2_BUCKET_NAME
NEXT_PUBLIC_MEDIA_URL
AMAZON_PARTNER_TAG
```

Optional: `OPENAI_API_KEY` (fallback AI), `ANTHROPIC_API_KEY` (blog AI).

### Key Conventions

- `lib/utils.ts` exports `cn()` (clsx + tailwind-merge) — use for all className composition
- Admin-only Supabase operations must use the admin client (`utils/supabase/admin.ts`), never the anon client
- Images are stored in Cloudflare R2 and served via `NEXT_PUBLIC_MEDIA_URL`; use Next.js `<Image>` with the allowed remote patterns in `next.config.ts`
- Security headers are set globally in `next.config.ts`; do not bypass them
- Blog content is sanitized with DOMPurify before rendering

## Upgrade History

- **Next.js 15.2.0 → 16.1.7** ✅ (March 2026) via `npx @next/codemod@canary upgrade latest`
- **React 19.0.0 → 19.2.4** ✅
- Turbopack is now default for both `dev` and `build` — shown as `▲ Next.js 16.1.7 (Turbopack)` in output
- All 29 routes verified working after upgrade
- First build after deleting `.next` may show a transient `PageNotFoundError (ENOENT)` from Turbopack cold-start — re-running `npm run build` resolves it

## Current Issues & Recent History

### Fixed Issues
- cookies() outside request scope → fixed via form action={login}
- @supabase/ssr compatibility with Next.js 15 → resolved
- Next.js 15 async params migration → completed across all pages
- Supabase RLS infinite recursion on profiles table → fixed
- Assets table created for Cloudflare R2 sync → done

### Known Pending Issues
- Store logos not showing on public homepage (broken img src)
- Homepage fetches stores but logo_url displays broken
- next.config.ts may be missing media.uaediscounthub.com domain

### Claude Code Rules (Token Saving)
- Use /compact when context gets long
- Fix ONE issue at a time
- Always run npm run build before marking done
- Never read node_modules
- Check CLAUDE.md before starting any session
- Use admin client for all admin panel DB operations
- Use server client inside server actions only
```

---