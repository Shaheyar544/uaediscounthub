---
area: api-endpoints
importance: critical
last-reviewed: 2026-09-24
source-of-truth:
  - app/api/
---

# API & Route Handlers Reference

## 1. Automation & Cron Endpoints

### `POST /api/admin/cron/update-prices`
* **Purpose**: Refreshes real-time Amazon UAE prices for all active ASINs in batches of 10.
* **Auth**: Bearer Token (`IMPORT_API_KEY`).
* **Input**: None (reads all active ASINs from `products` and `deals`).
* **Output**: `{ success: true, message: string }`.
* **Implementation**: `app/api/admin/cron/update-prices/route.ts` $\rightarrow$ `lib/amazon-creators-api.ts`.

---

## 2. Bulk Coupon Import APIs

### `POST /api/admin/coupons/import/analyze`
* **Purpose**: Parses uploaded CSV data, auto-maps columns, and identifies known vs unknown stores.
* **Auth**: Admin Session.
* **Implementation**: `app/api/admin/coupons/import/analyze/route.ts` $\rightarrow$ `lib/coupons/import/service.ts`.

### `POST /api/admin/coupons/import/stage`
* **Purpose**: Validates, normalizes, deduplicates, and saves CSV records into `coupon_imports` and `coupon_import_items`.
* **Auth**: Admin Session.
* **Implementation**: `app/api/admin/coupons/import/stage/route.ts`.

### `POST /api/admin/coupons/import/[importId]/commit`
* **Purpose**: Moves staged coupons into the live `coupons` table and updates `coupon_store_aliases`.
* **Auth**: Admin Session.
* **Implementation**: `app/api/admin/coupons/import/[importId]/commit/route.ts`.

### `GET / POST /api/admin/coupons/store-aliases`
* **Purpose**: Fetches or registers custom store aliases (e.g. mapping "Amzn" to "Amazon UAE").
* **Auth**: Admin Session.
* **Implementation**: `app/api/admin/coupons/store-aliases/route.ts`.

---

## 3. Bulk Store Import APIs

### `POST /api/admin/stores/import/analyze` & `/commit`
* **Purpose**: Bulk analyzes and imports store catalogs from CSV with auto-slug generation.
* **Auth**: Admin Session.
* **Implementation**: `app/api/admin/stores/import/...` $\rightarrow$ `lib/stores/import.ts`.

---

## 4. Product & Deals Admin APIs

### `POST /api/admin/import-product`
* **Purpose**: Imports a single product by Amazon ASIN, fetching details via Amazon Creators API.
* **Auth**: Admin Session.
* **Implementation**: `app/api/admin/import-product/route.ts`.

### `POST /api/admin/import-deals`
* **Purpose**: Creates deals for products with discounted pricing.
* **Auth**: Admin Session.
* **Implementation**: `app/api/admin/import-deals/route.ts`.

### `GET /api/admin/check-price-history`
* **Purpose**: Retrieves price tracking points for an ASIN.
* **Auth**: Admin Session.
* **Implementation**: `app/api/admin/check-price-history/route.ts`.

### `GET /api/admin/global-search`
* **Purpose**: Command Center quick search across products, stores, coupons, and deals.
* **Auth**: Admin Session.
* **Implementation**: `app/api/admin/global-search/route.ts`.

---

## 5. Blog & Content APIs

### `POST /api/blog/ai-assist`
* **Purpose**: Queries DeepSeek AI to generate blog titles, outlines, introductions, FAQ schemas, or Arabic translations.
* **Auth**: Admin Session.
* **Input**: `{ action: 'generate_outline' | 'translate' | 'seo_faq', prompt: string, context?: any }`.
* **Implementation**: `app/api/blog/ai-assist/route.ts` $\rightarrow$ `utils/ai/deepseek.ts`.

### `GET / POST /api/blog/posts`
* **Purpose**: Public/Admin article listing and post creation.
* **Implementation**: `app/api/blog/posts/route.ts`.

### `POST /api/blog/posts/[id]/view`
* **Purpose**: Increments article view count atomically.
* **Auth**: None (Public).
* **Implementation**: `app/api/blog/posts/[id]/view/route.ts`.

---

## 6. Media & Object Storage APIs

### `POST /api/upload/image` & `POST /api/blog/upload-image`
* **Purpose**: Uploads image files (JPEG, PNG, WebP) to Cloudflare R2 object storage.
* **Auth**: Admin Session.
* **Input**: `multipart/form-data` with `file`.
* **Output**: `{ url: "https://media.uaediscounthub.com/..." }`.
* **Implementation**: `app/api/upload/image/route.ts` $\rightarrow$ `lib/r2-storage.ts`.

---

## 7. Public Interactivity & Tracking APIs

### `POST /api/coupons/track`
* **Purpose**: Logs coupon copy events and affiliate click-throughs.
* **Auth**: None (Public).
* **Implementation**: `app/api/coupons/track/route.ts`.

### `POST /api/alerts/trigger-whatsapp`
* **Purpose**: Dispatches price drop notifications to subscribed users via Twilio WhatsApp.
* **Auth**: Bearer Token or Internal.
* **Implementation**: `app/api/alerts/trigger-whatsapp/route.ts`.
