---
area: routing
importance: critical
last-reviewed: 2026-09-24
source-of-truth:
  - app/
  - utils/supabase/middleware.ts
---

# Application Routes Reference

All customer-facing routes are localized under `/[locale]` where `locale` is either `en` (English) or `ar` (Arabic).

---

## 1. Public Consumer Routes

| Path | Purpose | Main File | Auth Req | Module |
| :--- | :--- | :--- | :--- | :--- |
| `/[locale]` | Homepage (Hero, Featured Stores, Today's Deals, Coupons) | `app/[locale]/page.tsx` | None | Home |
| `/[locale]/deals` | Deals & Flash Sales Catalog | `app/[locale]/deals/page.tsx` | None | Deals |
| `/[locale]/coupons` | Global Coupons Directory | `app/[locale]/coupons/page.tsx` | None | Coupons |
| `/[locale]/coupons/[storeSlug]` | Store-Specific Coupons Page | `app/[locale]/coupons/[storeSlug]/page.tsx` | None | Coupons |
| `/[locale]/category/[slug]` | Category Products Grid | `app/[locale]/category/[slug]/page.tsx` | None | Products |
| `/[locale]/product/[slug]` | Product Detail & Multi-Store Price Comparison | `app/[locale]/product/[slug]/page.tsx` | None | Products |
| `/[locale]/compare` | Side-by-Side Product Comparison Matrix | `app/[locale]/compare/page.tsx` | None | Products |
| `/[locale]/search` | Keyword & SKU/ASIN Search Results | `app/[locale]/search/page.tsx` | None | Search |
| `/[locale]/blog` | Tech Blog & Buying Guides Index | `app/[locale]/blog/page.tsx` | None | Blog |
| `/[locale]/blog/[slug]` | Single Blog Article Reader | `app/[locale]/blog/[slug]/page.tsx` | None | Blog |
| `/[locale]/[slug]` | Dynamic CMS Page (About, Privacy, Terms, Cookie, Disclaimer) | `app/[locale]/[slug]/page.tsx` | None | CMS / Pages |

---

## 2. Authentication Routes

| Path | Purpose | Main File | Auth Req | Module |
| :--- | :--- | :--- | :--- | :--- |
| `/[locale]/login` | Admin & User Sign In / Sign Up | `app/[locale]/login/page.tsx` | None | Auth |
| `/api/auth/callback` | OAuth & Email Confirmation Callback | `app/api/auth/callback/route.ts` | None | Auth |
| `/api/auth/signout` | User Session Logout | `app/api/auth/signout/route.ts` | Session | Auth |

---

## 3. Admin Workspace Routes (Protected)
*All admin routes require `user.app_metadata.role === 'admin'`. Unauthorized users are redirected to `/[locale]/login`.*

| Path | Purpose | Main File | Auth Req | Module |
| :--- | :--- | :--- | :--- | :--- |
| `/[locale]/admin` | Operations Dashboard & KPI Overview | `app/[locale]/admin/page.tsx` | Admin | Admin Core |
| `/[locale]/admin/products` | Master Product Management Table | `app/[locale]/admin/products/page.tsx` | Admin | Products |
| `/[locale]/admin/products/new` | Add Product Form | `app/[locale]/admin/products/new/page.tsx` | Admin | Products |
| `/[locale]/admin/products/[id]/edit`| Edit Product Details & Store Prices | `app/[locale]/admin/products/[id]/edit/page.tsx`| Admin | Products |
| `/[locale]/admin/deals` | Deals Registry & Discount Editor | `app/[locale]/admin/deals/page.tsx` | Admin | Deals |
| `/[locale]/admin/coupons` | Coupon Registry Table | `app/[locale]/admin/coupons/page.tsx` | Admin | Coupons |
| `/[locale]/admin/coupons/import` | Multi-Stage Bulk Coupon CSV Import Wizard | `app/[locale]/admin/coupons/import/page.tsx` | Admin | Coupons |
| `/[locale]/admin/coupons/new` | Create Single Coupon | `app/[locale]/admin/coupons/new/page.tsx` | Admin | Coupons |
| `/[locale]/admin/coupons/[id]/edit` | Edit Coupon Code & Expiry | `app/[locale]/admin/coupons/[id]/edit/page.tsx` | Admin | Coupons |
| `/[locale]/admin/stores` | Retailers & Affiliate Base URLs | `app/[locale]/admin/stores/page.tsx` | Admin | Stores |
| `/[locale]/admin/stores/import` | Bulk Store CSV Importer | `app/[locale]/admin/stores/import/page.tsx` | Admin | Stores |
| `/[locale]/admin/categories` | Categories Taxonomy Manager | `app/[locale]/admin/categories/page.tsx` | Admin | Categories |
| `/[locale]/admin/blog` | Blog Articles Management Table | `app/[locale]/admin/blog/page.tsx` | Admin | Blog |
| `/[locale]/admin/blog/new` | Write Article with DeepSeek AI Assist | `app/[locale]/admin/blog/new/page.tsx` | Admin | Blog |
| `/[locale]/admin/blog/[id]/edit` | TipTap Post Editor & SEO Checklist | `app/[locale]/admin/blog/[id]/edit/page.tsx` | Admin | Blog |
| `/[locale]/admin/blog/ad-widgets` | Blog In-Feed Ad Placements | `app/[locale]/admin/blog/ad-widgets/page.tsx` | Admin | Blog |
| `/[locale]/admin/pages` | CMS Static Pages & Footer Placements | `app/[locale]/admin/pages/page.tsx` | Admin | CMS / Pages |
| `/[locale]/admin/newsletters` | Newsletter Subscribers & CSV Export | `app/[locale]/admin/newsletters/page.tsx` | Admin | Marketing |
| `/[locale]/admin/users` | User Accounts & Role Permissions | `app/[locale]/admin/users/page.tsx` | Admin | Users |
| `/[locale]/admin/profile` | Admin User Profile & Settings | `app/[locale]/admin/profile/page.tsx` | Admin | Users |
| `/[locale]/admin/settings` | Global System Settings & Social Links | `app/[locale]/admin/settings/page.tsx` | Admin | Settings |
| `/[locale]/admin/api-sandbox` | Live Testing for Amazon API & Crons | `app/[locale]/admin/api-sandbox/page.tsx` | Admin | Diagnostics |

---

## 4. System SEO Routes

| Path | Purpose | Main File |
| :--- | :--- | :--- |
| `/sitemap.xml` | Dynamic bilingual XML Sitemap (Products, Deals, Coupons, Blog, Categories) | `app/sitemap.ts` |
| `/robots.txt` | Crawler directives & sitemap location | `app/robots.ts` |
