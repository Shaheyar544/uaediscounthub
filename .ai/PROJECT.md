---
area: project-overview
importance: critical
last-reviewed: 2026-09-24
source-of-truth:
  - package.json
  - app/[locale]/layout.tsx
  - supabase/schema.sql
---

# UAEDiscountHub — Project Overview

## 1. What the System Does
**UAEDiscountHub** (`uaediscounthub.com`) is an enterprise-grade, bilingual (English/Arabic), AI-assisted price comparison, coupon curation, and deal aggregation platform for the United Arab Emirates (UAE), Saudi Arabia (KSA), and broader GCC region.

The platform monitors, compares, and catalogs real-time prices across major regional e-commerce stores (Amazon AE, Noon, Sharaf DG, Carrefour, etc.), aggregates promo coupons, provides AI product summaries and pros/cons, and monetizes via affiliate links (Amazon Associates, Arabclicks, and regional affiliate networks) and Google AdSense.

---

## 2. Main Users
1. **Shoppers / Public Consumers**: Browse live tech deals, search products by name/SKU/ASIN, compare multi-store prices, copy verified coupon codes, read tech buying guides, and subscribe to price drop alerts (email/WhatsApp).
2. **Platform Administrators**: Manage product catalogs, bulk import coupons/stores via CSV staging wizards, trigger Amazon Creator API price refresh crons, publish SEO-optimized blog posts with AI assistance, manage static/compliance pages, and view analytics.

---

## 3. Main Workflows
* **Product Search & Comparison**: Shoppers search products by keyword or Amazon ASIN/SKU with instant faceted filtering. Product pages render live multi-store price ladders, estimated lowest prices, price history charts, and AI-generated summaries.
* **Coupon Curation & Redemption**: Users browse store coupons, copy promo codes with one click, and follow affiliate-tagged store links. Admins bulk import hundreds of coupons via a multi-stage CSV import wizard with alias resolution and duplicate prevention.
* **Automated Price Sync**: A 6-hour cron (`POST /api/admin/cron/update-prices`) calls the Amazon Creators API to sync live prices for all registered ASINs in batches of 10, updating product prices and logging runs to `api_sync_logs`.
* **AI-Assisted Blog & SEO**: Admins draft and publish blog posts using a rich TipTap editor with automated DeepSeek AI content suggestions, SEO keyword checklists, Google SERP previews, and structured JSON-LD FAQ schema.
* **Internationalization & Legal Compliance**: Dual-locale routing (`/en` and `/ar`) with full RTL support, GDPR/UAE PDPL cookie consent banner, and publisher compliance pages.

---

## 4. Tech Stack & Key Libraries
| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 16.1.7 (App Router, Server Actions, Route Handlers, React 19) |
| **Styling** | Tailwind CSS v4, `@tailwindcss/typography`, `tw-animate-css`, `framer-motion` |
| **UI Components** | Radix UI primitives (`@radix-ui/react-switch`), Shadcn UI patterns, `lucide-react` |
| **Database & Auth** | Supabase (PostgreSQL, Supabase Auth SSR `@supabase/ssr`, RLS policies) |
| **Rich Text Editor** | TipTap v3 (`@tiptap/react`, `@tiptap/starter-kit`, Table, Image, Link, Underline extensions) |
| **Object Storage** | Cloudflare R2 via AWS SDK (`@aws-sdk/client-s3`) |
| **AI Integration** | DeepSeek API (`utils/ai/deepseek.ts`), Anthropic SDK (`@anthropic-ai/sdk`) |
| **External APIs** | Amazon Creators API (`lib/amazon-creators-api.ts`), Amazon PA-API, Resend, Twilio |
| **Internationalization** | Custom dictionary-based i18n (`i18n/config.ts`, `i18n/dictionaries.ts`, `en.json`, `ar.json`) |

---

## 5. Main Application Modules
* **Public Catalog & Deals**: `app/[locale]/page.tsx`, `deals/`, `category/[slug]/`, `product/[slug]/`, `compare/`
* **Coupons System**: `app/[locale]/coupons/`, `app/[locale]/coupons/[storeSlug]/`
* **Search Engine**: `app/[locale]/search/page.tsx` (supports fuzzy term matching, Arabic, English, and SKU/ASIN lookup)
* **Blog & Content Hub**: `app/[locale]/blog/`, `app/[locale]/blog/[slug]/`
* **Admin Dashboard Suite**: `app/[locale]/admin/` (Products, Deals, Coupons + CSV Importer, Stores, Pages, Blog + AI, Users, Settings, API Sandbox)
* **API Route Handlers**: `app/api/` (Cron price sync, store/coupon import staging, WhatsApp alerts, image uploads, AI assist)

---

## 6. High-Level Data Flow
```
User / Browser
      │
      ▼
Next.js App Router (app/[locale]/...) ──[Middleware: session & admin check]
      │
      ├── Server Components (Direct read via @supabase/ssr server client)
      │         │
      │         ▼
      │    Supabase PostgreSQL (Products, Stores, Coupons, Deals, Blog)
      │
      ├── Client Components (Interactive actions, copy code, compare drawer)
      │         │
      │         ▼
      │    Server Actions & Route Handlers (/api/admin/..., /api/coupons/...)
      │         │
      │         ├── Supabase Service Role Admin Client (bypassing RLS for admin tasks)
      │         ├── Amazon Creators API (Batch pricing for ASINs)
      │         ├── DeepSeek AI API (Content & summary generation)
      │         └── Cloudflare R2 (Direct image uploads & media delivery)
```
