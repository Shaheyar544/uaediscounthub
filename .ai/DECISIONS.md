---
area: architecture-decisions
importance: high
last-reviewed: 2026-09-24
source-of-truth:
  - app/
  - components/
  - lib/
  - utils/
---

# Architectural Decision Records (ADR)

This document records the core architectural and technical choices established in the UAEDiscountHub codebase.

---

### ADR-001 — Next.js 16 App Router with Server-First Rendering
* **Decision**: Implement all primary page views as React Server Components (RSC) fetching directly from Supabase, keeping Client Components strictly isolated to interactive elements.
* **Reason**: Optimal SSR, instant initial page load for e-commerce search engines, zero client bundle overhead for static markup, and excellent SEO ranking in GCC markets.
* **Important Consequence**: Pages must handle `params` and `searchParams` as Promises.
* **Future agents should not**: Convert full pages into `"use client"` or fetch data through client-side `useEffect` when Server Component SSR is available.

---

### ADR-002 — Supabase Dual-Client Access Model
* **Decision**: Use `@supabase/ssr` with HTTP-only cookies (`createClient()`) for public and authenticated user operations, and a dedicated service-role admin client (`createAdminClient()`) for admin mutations and cron syncs.
* **Reason**: Enforces PostgreSQL Row-Level Security (RLS) for public visitors while allowing privileged backend services to safely manage bulk imports and background pricing syncs.
* **Important Consequence**: Never import `createAdminClient` inside client-side components.

---

### ADR-003 — Cloudflare R2 Object Storage for Images
* **Decision**: Store all uploaded product photos, store logos, and blog hero banners in Cloudflare R2 via `@aws-sdk/client-s3` served via `https://media.uaediscounthub.com`.
* **Reason**: Zero egress bandwidth fees, high upload speeds, and reliable global CDN delivery across the UAE and GCC.
* **Important Consequence**: File upload routes must sanitize file extensions, validate MIME types, and restrict size to 5MB.

---

### ADR-004 — Amazon Creators API Batch Price Synchronization
* **Decision**: Refresh Amazon prices using `POST /api/admin/cron/update-prices` by chunking ASINs into batches of 10.
* **Reason**: Amazon PA-API limits batch queries to 10 items per request. Chunking prevents rate-limiting and API timeouts while updating hundreds of products efficiently.
* **Important Consequence**: ASINs must be exactly 10 alphanumeric characters.

---

### ADR-005 — 3-Stage CSV Bulk Import Engine for Coupons
* **Decision**: Implement coupon importing through a three-stage lifecycle: `Analyze` $\rightarrow$ `Stage` $\rightarrow$ `Commit` with dedicated `coupon_store_aliases` resolution.
* **Reason**: Affiliate CSVs from networks (like Arabclicks) use inconsistent store names (e.g. "Amzn", "Amazon AE", "Amazon.com.ded"). Staging allows admins to preview validation errors and resolve store aliases before modifying the live `coupons` table.

---

### ADR-006 — Standard `<img>` Elements for Product Grid Thumbnail Cards
* **Decision**: Use standard HTML `<img>` tags with `object-contain` inside `DealCard.tsx` rather than Next.js `<Image fill />`.
* **Reason**: Next.js `<Image fill />` elements collapse to `0px` height/width when rendered inside centered flexbox containers across certain browser rendering engines. Standard `<img>` elements render reliably with zero hydration failure.

---

### ADR-007 — Dual-Locale (`/en` and `/ar`) with Directional RTL Support
* **Decision**: Structure routing with `/[locale]` and configure `<html dir="rtl">` for Arabic without duplicating components.
* **Reason**: Essential for ranking and user engagement in the UAE, KSA, and GCC markets.
* **Important Consequence**: Layouts must use CSS logical properties (`ms-`, `me-`, `text-start`, `text-end`) rather than hardcoded `left`/`right`.

---

### ADR-008 — Search Engine SKU & ASIN Inclusion
* **Decision**: Include partial and exact matching on `sku` and `asin` columns alongside `name_en`, `name_ar`, and `description_*` in `app/[locale]/search/page.tsx`.
* **Reason**: Power users, affiliate managers, and shoppers frequently search directly using product model numbers or Amazon ASIN codes.
