---
area: system-architecture
importance: critical
last-reviewed: 2026-09-24
source-of-truth:
  - app/[locale]/layout.tsx
  - app/[locale]/admin/layout.tsx
  - utils/supabase/server.ts
  - utils/supabase/admin.ts
  - utils/supabase/middleware.ts
---

# System Architecture & Technical Design

## 1. Architectural Overview
UAEDiscountHub is built on Next.js App Router following a hybrid Server-Driven / Client-Interactive architecture.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                            │
│  Public Pages (RSC) │ Interactive Client Widgets │ Admin App Shell (RSC)│
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      ROUTING & AUTH MIDDLEWARE                          │
│  Locale Detection (/en, /ar) │ Session Refresh │ Admin Role Guard       │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  ▼                                 ▼
┌───────────────────────────────────┐  ┌──────────────────────────────────┐
│        DATA ACCESS LAYER          │  │     SERVICE / INTEGRATION LAYER  │
│  - Supabase SSR Client (Public)   │  │  - Coupon & Store Import Engine  │
│  - Supabase Admin Client (Role)   │  │  - Amazon Creators API Service   │
│  - Row Level Security (RLS)       │  │  - DeepSeek AI Engine            │
│  - Server Actions & API Handlers  │  │  - Cloudflare R2 Media Storage   │
└───────────────────────────────────┘  └──────────────────────────────────┘
                  │                                 │
                  ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     PERSISTENCE & EXTERNAL SERVICES                     │
│  Supabase PostgreSQL │ Cloudflare R2 │ Amazon PA-API │ Telegram / Bot   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Structure & Server/Client Boundaries

### A. Layout Hierarchy & Internationalization
* **Root Layout (`app/[locale]/layout.tsx`)**:
  * Wraps the application with `ThemeProvider` (`next-themes`), `AnalyticsProvider` (`posthog-js`), `Navbar`, `FlashBanner`, `MobileBottomNav`, `Footer`, and `CookieConsent`.
  * Injects Google Fonts (`Outfit` for display headings, `DM Sans` for body, `Geist Mono` for codes).
  * Automatically sets `<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>`.
* **Admin Layout (`app/[locale]/admin/layout.tsx`)**:
  * Guarded by `requireAdmin()`.
  * Wraps admin pages inside `AdminAppShell` with `AdminSidebar`, `AdminMobileSidebar`, `AdminCommandCenter`, and `AdminUserMenu`.

### B. Server vs Client Component Division
* **Server Components (Default)**: Used for all primary page entrypoints (`page.tsx`) to fetch initial data directly from Supabase with zero client JS overhead and full SSR/SEO optimization.
* **Client Components (`"use client"`)**: Isolated to user interactivity:
  * `FacetedFilters.tsx`, `SearchInput.tsx`, `CompareBar.tsx` (Client filtering & search state)
  * `CouponCardV2.tsx`, `CopyButton.tsx` (Code copying, modal state, track view)
  * `ProductGallery.tsx`, `PriceHistoryChart.tsx` (Image zoom, Chart visualization)
  * Admin interactive clients: `ProductsTableClient.tsx`, `DealsTableClient.tsx`, `CouponRegistryTable.tsx`, `CouponImportWizard.tsx`, `StoreImportWizard.tsx`, `PostEditor.tsx`.

---

## 3. Backend & API Structure

### A. Data Fetching Patterns
1. **Public Reads (Read-Heavy)**: Server Components instantiate `createClient()` from `utils/supabase/server.ts`, querying PostgreSQL with Supabase RLS applied.
2. **Admin Operations (Write-Heavy)**: Server Actions in dedicated `actions.ts` files or Route Handlers in `app/api/admin/...` verify admin authorization and perform mutations using `createAdminClient()` from `utils/supabase/admin.ts`.
3. **Automated Background Tasks (Cron)**: Route handlers (e.g. `POST /api/admin/cron/update-prices`) accept HTTP requests with Bearer `IMPORT_API_KEY`, validate the secret, and invoke background execution (using Next.js `waitUntil` or detached promises).

---

## 4. Service Subsystems

### A. Amazon Creators API Integration (`lib/amazon-creators-api.ts`)
* Implements batch lookup for Amazon ASINs (max 10 ASINs per call).
* Extracts real-time pricing, discounts, stock availability, and affiliate links for Amazon UAE.
* Used by the 6-hour cron sync and admin product import dialogs.

### B. Bulk Coupon Import & Resolution Engine (`lib/coupons/import/`)
* **`parse.ts`**: Flexible CSV parsing supporting varying column header names (e.g. `Code`, `Promo`, `Coupon`, `Discount`, `Store`).
* **`normalize.ts`**: Trims, cleans, and standardizes discount percentages, fixed amounts, and validity dates.
* **`store-aliases.ts` & `stores.ts`**: Maps messy CSV store names (e.g. "Amazon AE", "Amazon.com.ded", "Amzn") to canonical database store IDs using `coupon_store_aliases`.
* **`duplicates.ts` & `validate.ts`**: Detects duplicate codes within the batch and existing database records.
* **`service.ts`**: Multi-stage staging and commit lifecycle (`analyze` $\rightarrow$ `stage` $\rightarrow$ `commit`).

### C. Cloudflare R2 Storage Subsystem (`lib/r2-storage.ts`)
* Uses `@aws-sdk/client-s3` targeting Cloudflare R2 bucket (`uaediscounthub`).
* Handles image uploads for product thumbnails, blog featured images, and store logos via `app/api/upload/image/route.ts` and `app/api/blog/upload-image/route.ts`.
* Generates public CDN URLs using `https://media.uaediscounthub.com/...`.

### D. AI Assistance Engine (`utils/ai/deepseek.ts`)
* Interfaces with DeepSeek API for automated Arabic/English translations, blog outline generation, and product pros/cons synthesis.

---

## 5. State Management & Hooks
* **Compare Drawer**: `hooks/use-compare.ts` manages selected product comparison IDs persisted in `localStorage`.
* **Mount State**: `hooks/use-has-mounted.ts` prevents hydration mismatch on client-rendered local storage widgets.
* **Theme State**: Handled globally by `next-themes` (`light`, `dark`, `system`).
