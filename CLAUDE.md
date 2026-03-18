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

### Database Migrations (Supabase CLI)

Supabase CLI v2.79.0 is installed as a dev dependency. Project is linked to the remote Supabase instance.

```bash
# Create a new migration
npm run db:new -- <migration_name>
# → creates supabase/migrations/YYYYMMDDHHMMSS_migration_name.sql
# → add your SQL to that file, then push

# Apply all pending migrations to remote DB
npm run db:push

# Check which migrations have been applied
npm run db:status
```

All future schema changes MUST go through migrations — never use raw SQL Editor for new changes.
Migration files live in `supabase/migrations/`. Existing reference SQL in `supabase/*.sql` is historical docs only.

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

## Session Summary — March 17, 2026

### Completed Today
- Next.js upgraded 15.2.0 → 16.1.7 ✅
- React upgraded 19.0.0 → 19.2.4 ✅
- Turbopack enabled by default for dev + build ✅
- Featured Stores logos fixed on homepage ✅
- Product Admin completely rebuilt (6-section form) ✅
- `product_store_prices` table created via migration ✅
- Multi-store price comparison on public product page ✅
- Store price errors surfaced in UI (amber warning banner) ✅
- Supabase CLI installed (v2.79.0) and linked to project ✅
- Migration system set up (`supabase/migrations/`) ✅
- `currency` column added via `db:push` — confirmed applied ✅

## Session Summary — March 18, 2026

### Completed Today
- Chrome Extension (Manifest V3) built for Amazon.ae product scraping → admin import ✅
- Fixed middleware blocking `/api/admin/...` routes (added `!pathname.startsWith('/api/')`) ✅
- Chrome extension slug generation + coupon code scraping improvements ✅
- Product page improvements: title typography, AI summary dedup fix, ShareButton (Web Share API + clipboard fallback) ✅
- Mobile responsiveness audit (375px): gallery thumbnails, PriceComparisonTable dual layout, badge visibility ✅
- Price history chart fixed: RLS SELECT policy migration, `source` column added, admin client for page queries, silent error capture ✅
- Complete homepage premium redesign — 8 sections: HeroSection, FeaturedStores, CategoryBrowsing, DealCard, CouponCard, NewsletterSignup, PriceAlertBanner, TrustBar ✅
- Homepage follow-up fixes: hero bottom fade, store logo React state fallback, real DB category counts, MobileBottomNav, FlashBanner gradient, RecentlyViewed (localStorage), ISR revalidate=300 ✅
- Build passes cleanly, all 5 URLs return correct HTTP status ✅
- Pushed to GitHub origin/main ✅

### Pending for Next Session
- Deploy to Hostinger: `git pull && npm run build && pm2 restart all`
- Lighthouse performance audit (target 70+ on mobile)
- Arabic (RTL) layout testing
- SEO meta tags audit per-page (product, category, blog)
- Sitemap generation / submission to Google Search Console
- SendPulse domain verification completion
- Test affiliate link click-through on product page
- Reload Supabase schema cache if any "column not found" errors appear:
  Dashboard → Settings → API → Reload Schema Cache

### How to Resume Next Session
Tell Claude Code: "Read CLAUDE.md and continue from where we left off. Check pending items."

## Current Issues & Recent History

### Fixed Issues
- cookies() outside request scope → fixed via form action={login}
- @supabase/ssr compatibility with Next.js 15 → resolved
- Next.js 15 async params migration → completed across all pages
- Supabase RLS infinite recursion on profiles table → fixed
- Assets table created for Cloudflare R2 sync → done
- Store logos broken on public homepage → fixed (conditional render with letter fallback)
- `CREATE POLICY IF NOT EXISTS` invalid PostgreSQL syntax → fixed with DO block in migration
- Price history RLS blocking anon SELECT → fixed with public SELECT policy migration
- `source` column missing from price_history → added via migration
- Price history chart empty despite DB data → fixed (admin client + RLS + source column)
- AI summary showing duplicate content → fixed (conditional render only when ai_summary_en exists)
- Share button not using Web Share API → rebuilt with native share + clipboard fallback
- Mobile layout broken at 375px → fixed gallery, PriceComparisonTable, badges
- Middleware blocking Chrome extension API calls → fixed with `!pathname.startsWith('/api/')` guard
- Homepage using hardcoded category counts → replaced with real DB counts

### Known Pending Issues
- Hostinger production not yet updated (needs git pull + rebuild + pm2 restart)
- Lighthouse score not yet measured (target: 70+ mobile)

### Claude Code Rules (Token Saving)
- Use /compact when context gets long
- Fix ONE issue at a time
- Always run npm run build before marking done
- Never read node_modules
- Check CLAUDE.md before starting any session
- Use admin client for all admin panel DB operations
- Use server client inside server actions only

---