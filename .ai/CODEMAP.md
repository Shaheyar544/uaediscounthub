---
area: code-map
importance: critical
last-reviewed: 2026-09-24
source-of-truth:
  - app/
  - components/
  - lib/
  - utils/
  - supabase/
---

# UAEDiscountHub — Code Map

This document maps all application features and modules directly to their source files, database models, APIs, and dependencies.

---

## 1. Product & Catalog Module
**Purpose**: Catalog management, product detail view, image galleries, category browsing, and SKU/ASIN lookup.

**Main Files**:
* `app/[locale]/product/[slug]/page.tsx` — Public product detail page with price comparison, AI summary, SKU/ASIN display, and price history chart.
* `app/[locale]/category/[slug]/page.tsx` — Category catalog page listing products by category.
* `app/[locale]/admin/products/page.tsx` — Admin product listing table with search, category filtering, and status badges.
* `app/[locale]/admin/products/new/page.tsx` & `[id]/edit/page.tsx` — Admin product creation and editing form.
* `app/[locale]/admin/products/actions.ts` & `product-actions.ts` — Server actions for product CRUD operations.
* `components/product/ProductGallery.tsx` — Image zoom and thumbnail selector.
* `components/product/AmazonProductCard.tsx` — Amazon product display widget with price tags.
* `components/admin/products/ProductForm.tsx` — Reusable product form with R2 image uploads and price inputs.
* `components/admin/products/ProductsTableClient.tsx` — Interactive product data table with pagination and bulk filters.

**Database Models**: `products`, `categories`, `product_prices`, `product_store_prices`
**APIs / Actions**: `app/api/admin/import-product/route.ts`, `app/api/amazon/product/route.ts`
**Dependencies**: Cloudflare R2 storage, Amazon Creators API, Category Module

---

## 2. Multi-Store Price Comparison & History Module
**Purpose**: Compare live prices across UAE retailers (Amazon, Noon, Sharaf DG), visualize historical price drops, and calculate lowest estimated price.

**Main Files**:
* `components/product/PriceComparisonTable.tsx` — Multi-store price comparison ladder with store logos, coupon tags, and direct affiliate outbound buttons.
* `components/product/PriceHistoryChart.tsx` — Historical price tracking chart with highest, lowest, and current price trends.
* `hooks/use-compare.ts` — Client hook managing active compare session in `localStorage`.
* `components/compare/CompareBar.tsx` — Floating drawer allowing users to compare up to 4 products side-by-side.
* `app/[locale]/compare/page.tsx` — Full-page multi-product comparison grid.
* `app/api/admin/cron/update-prices/route.ts` — Background cron that refreshes live prices for all registered ASINs via Amazon Creators API.

**Database Models**: `product_prices`, `product_store_prices`, `price_history`, `stores`
**APIs**: `POST /api/admin/cron/update-prices`, `GET /api/admin/check-price-history`
**Dependencies**: Product Module, Stores Module, Amazon Creators API

---

## 3. Deals & Flash Sales Module
**Purpose**: Curate, display, and highlight limited-time discount deals, flash sales, and price drops.

**Main Files**:
* `app/[locale]/deals/page.tsx` — Public deals discovery hub with discount percentage sorting and store filters.
* `components/home/DealCard.tsx` — Optimized deal card rendering price badges, store logos, and sanitized image URLs.
* `components/deals/DealsCatalog.tsx` — Client catalog with instant store, category, and discount range filters.
* `app/[locale]/admin/deals/page.tsx` — Admin deals management table with active/expired toggles.
* `app/[locale]/admin/deals/actions.ts` — Server actions for deal creation, updating, and deletion.
* `components/admin/deals/DealsTableClient.tsx` — Admin interactive deals table with search and inline edits.
* `components/admin/deals/EditDealModal.tsx` — Modal dialog to adjust deal prices, discount %, and expiry dates.

**Database Models**: `deals`, `products`, `stores`
**APIs**: `POST /api/admin/import-deals`
**Dependencies**: Product Module, Stores Module

---

## 4. Coupons & Bulk Import Module
**Purpose**: Curate verified coupon codes, copy-to-clipboard, track referral clicks, and bulk import coupons via multi-stage CSV engine.

**Main Files**:
* `app/[locale]/coupons/page.tsx` — Public coupon directory with store tabs and coupon search.
* `app/[locale]/coupons/[storeSlug]/page.tsx` — Dedicated store coupon landing page (e.g. Amazon AE, Noon coupons).
* `components/coupons/CouponCardV2.tsx` — Glassmorphic coupon card with "Show Code" modal, copy feedback, and affiliate link triggering.
* `components/coupons/StoreHeaderBanner.tsx` — Verified store badges, cashback terms, and active coupon counts.
* `app/[locale]/admin/coupons/page.tsx` — Admin coupon registry with expiration indicators and bulk actions.
* `app/[locale]/admin/coupons/import/page.tsx` — Multi-stage CSV coupon import wizard.
* `components/admin/coupons/CouponImportWizard.tsx` — UI wizard handling File Upload $\rightarrow$ Field Mapping $\rightarrow$ Store Resolution $\rightarrow$ Commit.
* `lib/coupons/import/service.ts` — Orchestrates staging, validation, deduplication, and database insertion.
* `lib/coupons/import/store-aliases.ts` — Store alias fuzzy resolution and alias creation.
* `lib/coupons/import/validate.ts` & `normalize.ts` — Validation rules and discount format normalizer.

**Database Models**: `coupons`, `stores`, `coupon_imports`, `coupon_import_items`, `coupon_store_aliases`
**APIs**:
* `POST /api/admin/coupons/import/analyze`
* `POST /api/admin/coupons/import/stage`
* `POST /api/admin/coupons/import/[importId]/commit`
* `GET/POST /api/admin/coupons/store-aliases`
* `POST /api/coupons/track`
* `GET /api/coupons/verify`
**Dependencies**: Stores Module, Affiliate Tracking

---

## 5. Search Engine & Discovery Module
**Purpose**: Instant product and deal search across English and Arabic fields, description text, and SKU/ASIN identifiers.

**Main Files**:
* `app/[locale]/search/page.tsx` — Search results page with term ranking and product store price mapping.
* `components/layout/SearchInput.tsx` — Global search bar with autocomplete suggestions, clear button, and recent searches.
* `components/search/FacetedFilters.tsx` — Client faceted sidebar filtering by price range, store, and brand.

**Database Models**: `products`, `product_store_prices`, `categories`, `stores`
**Dependencies**: Product Module, Categories Module

---

## 6. Blog & Content Hub Module
**Purpose**: SEO content marketing, product buying guides, tech reviews, AI content generation, and Google SERP optimization.

**Main Files**:
* `app/[locale]/blog/page.tsx` — Public blog articles feed with category tags and reading times.
* `app/[locale]/blog/[slug]/page.tsx` — Full article reader with Table of Contents, Deal Embeds, Reading Progress, and Ad Widgets.
* `app/[locale]/admin/blog/page.tsx` — Admin article management table with draft/published status.
* `app/[locale]/admin/blog/new/page.tsx` & `[id]/edit/page.tsx` — TipTap blog post editor with AI assistance panel.
* `components/admin/blog/PostEditor.tsx` — Feature-complete editor with DeepSeek AI drafting, SEO checklist, and SERP preview.
* `components/blog/DealEmbed.tsx` — In-article dynamic product/deal embed card.
* `components/blog/SEOChecklist.tsx` — Live scoring of title length, meta description, keyword density, and heading hierarchy.
* `app/api/blog/ai-assist/route.ts` — DeepSeek AI API proxy generating outlines, intros, FAQs, and translations.

**Database Models**: `blog_posts`, `categories`, `profiles`
**APIs**: `GET/POST /api/blog/posts`, `POST /api/blog/ai-assist`, `POST /api/blog/upload-image`, `POST /api/blog/posts/[id]/view`
**Dependencies**: Cloudflare R2 storage, DeepSeek AI, Category Module

---

## 7. Pages & Compliance Module
**Purpose**: CMS for dynamic static pages (About Us, Privacy Policy, Terms of Service, Cookie Policy, Affiliate Disclaimer).

**Main Files**:
* `app/[locale]/[slug]/page.tsx` — Dynamic CMS page renderer.
* `components/AboutUsLayout.tsx` — Dedicated visual About Us page layout.
* `app/[locale]/admin/pages/page.tsx` — Admin CMS pages listing with placement controls (`footer_c1`, `footer_c2`, `footer_c3`).
* `components/admin/pages/PageEditor.tsx` — Rich text editor for English and Arabic page contents.
* `components/layout/CookieConsent.tsx` — EU GDPR & UAE PDPL compliant cookie consent banner with localStorage persistence.
* `components/layout/Footer.tsx` — Dynamic footer rendering active CMS compliance links.

**Database Models**: `pages`
**Dependencies**: Supabase SSR Client, i18n Dictionary

---

## 8. Stores & Retailers Module
**Purpose**: Store profiles, merchant affiliate base URLs, store logos, and bulk store CSV import.

**Main Files**:
* `app/[locale]/admin/stores/page.tsx` — Admin stores table with active/featured toggles.
* `app/[locale]/admin/stores/import/page.tsx` — Bulk store CSV import wizard.
* `components/admin/stores/StoreImportWizard.tsx` — Store import UI wizard.
* `lib/stores/import.ts` — Store CSV parsing and bulk upsert handler.
* `components/home/FeaturedStores.tsx` — Homepage popular store logo slider/grid.

**Database Models**: `stores`, `store_imports`, `store_import_items`
**APIs**: `POST /api/admin/stores/import/analyze`, `POST /api/admin/stores/import/commit`, `POST /api/admin/stores/import/preview`
**Dependencies**: Cloudflare R2 storage

---

## 9. Authentication & Security Module
**Purpose**: User sign in, sign up, session management, and admin role enforcement.

**Main Files**:
* `app/[locale]/login/page.tsx` — Dual-purpose Sign In / Sign Up form.
* `app/[locale]/login/actions.ts` — Server actions for `login` and `signup` with Supabase Auth SSR.
* `utils/supabase/middleware.ts` — Global middleware checking session tokens and guarding `/admin` routes.
* `utils/auth/require-admin.ts` & `admin.ts` — Server-side guard verifying `user.app_metadata.role === 'admin'`.
* `utils/supabase/server.ts` & `admin.ts` — Server and Service Role Supabase clients.

**Database Models**: `auth.users`, `profiles`
**APIs**: `GET /api/auth/callback`, `POST /api/auth/signout`
**Dependencies**: Supabase Auth
