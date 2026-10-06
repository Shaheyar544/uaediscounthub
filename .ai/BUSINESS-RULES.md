---
area: business-rules
importance: critical
last-reviewed: 2026-09-24
source-of-truth:
  - app/
  - lib/coupons/import/
  - lib/amazon-creators-api.ts
  - supabase/schema.sql
---

# Business Rules & Logic Reference

## 1. Product, SKU & ASIN Rules
* **ASIN Identification**: Amazon ASINs must be exactly 10 alphanumeric characters (e.g. `B08166SLDF`). Both `sku` and `asin` columns in `products` are populated with this value.
* **Search Matching**: Search queries match across `name_en`, `name_ar`, `description_en`, `description_ar`, `sku`, and `asin`.
* **Lowest Price Rule**: The "Estimated Lowest Price" badge on product cards is computed as the minimum `price` among all available (`in_stock = true`) stores in `product_store_prices`.
* **Currency Standard**: All standard monetary amounts are in UAE Dirhams (`AED`) unless specified otherwise.

---

## 2. Multi-Store Pricing & Price History Rules
* **Price Refresh Interval**: Amazon prices are synced every 6 hours via the automated cron endpoint.
* **Price History Logging**: Every price update records a point in `price_history` with the current price, ASIN, and timestamp (`recorded_at = NOW()`).
* **Pricing Disclaimer**: Real-time prices may fluctuate on merchant sites; the final price shown on the retailer's checkout page is legally binding.

---

## 3. Coupon Curation & Bulk Import Rules
* **Uniqueness**: A coupon `code` must be unique per `store_id`. Upserts overwrite or update existing codes rather than creating duplicates.
* **Discount Types**: Must be strictly `'percent'` (e.g. 15 for 15%) or `'fixed'` (e.g. 50 for 50 AED).
* **Expiry Management**: Coupons with `expires_at < NOW()` or `is_active = false` are filtered out from public store and category views.
* **Bulk Import 3-Stage Pipeline**:
  1. **Analyze**: Parse raw CSV and flag recognized vs unknown store names.
  2. **Stage**: Save normalized rows into `coupon_import_items` with validation errors flagged.
  3. **Commit**: Migrate valid staged rows into live `coupons` table and register any new store aliases in `coupon_store_aliases`.

---

## 4. Deals & Flash Sales Rules
* **Discount Calculation**: `discount_percent` is strictly calculated as:
  $$\text{discount\_percent} = \text{round}\left(\frac{\text{original\_price} - \text{deal\_price}}{\text{original\_price}} \times 100\right)$$
* **Deal Validity**: A deal is publicly visible only when `is_active = true` AND (`expires_at` is NULL OR `expires_at > NOW()`).

---

## 5. Affiliate Tracking & Monetization Rules
* **Affiliate URL Formation**: Direct retailer links must append the platform's affiliate tracking ID (e.g. Amazon Partner Tag or Arabclicks tracking sub-id).
* **Click Tracking**: When users click outbound store links, a tracking event is logged to `affiliate_clicks` with privacy-preserving hashed IP and user agent.
* **No Added Cost**: Users pay standard retail pricing; commissions are paid by merchants.

---

## 6. Blog & Publishing Rules
* **Visibility**: Only blog posts with `is_published = true` and `published_at <= NOW()` are queryable on public routes.
* **View Counting**: Article views are recorded via `POST /api/blog/posts/[id]/view` to prevent double-counting on SSR renders.
* **Bilingual Parity**: Published articles should have both English and Arabic content for SEO indexation in GCC markets.

---

## 7. Legal & Compliance Rules
* **Cookie Consent**: Must prompt users for consent on first visit in compliance with EU GDPR and UAE Personal Data Protection Law (PDPL).
* **AdSense & Amazon Disclosures**: The site must maintain active, published compliance pages in the footer (`privacy-policy`, `terms-of-service`, `cookie-policy`, `disclaimer-page`) to retain Amazon Associates and Google AdSense approvals.
