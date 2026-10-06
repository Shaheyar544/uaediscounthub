---
area: database-schema
importance: critical
last-reviewed: 2026-09-24
source-of-truth:
  - supabase/schema.sql
  - supabase/migrations/
---

# Database Mental Model & Schema Reference

## 1. Overview
The database is PostgreSQL hosted on **Supabase** with Row-Level Security (RLS) enabled on all public tables. The data model is optimized for high-performance read queries, fast multi-store price lookups, and robust bulk import workflows.

---

## 2. Core Entities & Relationships

```
                        ┌────────────────┐
                        │   categories   │
                        └───────┬────────┘
                                │ (1:N)
                                ▼
┌──────────────┐ (1:N)  ┌────────────────┐ (1:N)  ┌────────────────────────┐
│    stores    ├───────►│    products    ├───────►│  product_store_prices  │
└──────┬───────┘        └───────┬────────┘        └────────────────────────┘
       │                        │ (1:N)
       │ (1:N)                  ▼
       │                ┌────────────────┐ (1:N)  ┌────────────────────────┐
       ├───────────────►│     deals      ├───────►│     price_history      │
       │                └────────────────┘        └────────────────────────┘
       │ (1:N)
       ▼
┌──────────────┐ (1:N)  ┌────────────────┐
│   coupons    │◄───────┤  coupon_alias  │
└──────────────┘        └────────────────┘
```

---

## 3. Key Tables & Field Meanings

### `products`
* **Purpose**: Master product catalog.
* **Key Fields**: `id` (UUID), `slug` (Unique), `category_id` (FK), `sku` (Unique / ASIN), `asin` (Amazon ASIN), `name_en`, `name_ar`, `description_en`, `description_ar`, `main_image_url`, `images` (JSONB array), `base_price`, `is_active`, `is_featured`.
* **Important Rule**: `sku` and `asin` store the exact 10-character Amazon ASIN to enable automated API price updates and direct SKU searches.

### `product_store_prices`
* **Purpose**: Real-time pricing ladder per store for a product.
* **Key Fields**: `id`, `product_id` (FK $\rightarrow$ products), `store_id` (FK $\rightarrow$ stores), `price`, `original_price`, `discount_percent`, `affiliate_url`, `coupon_code`, `coupon_discount`, `in_stock`, `is_best_price`, `last_checked_at`.
* **Constraints**: `UNIQUE(product_id, store_id)`.

### `price_history`
* **Purpose**: Records historical price snapshots for trend visualization.
* **Key Fields**: `id`, `product_id` (FK $\rightarrow$ products), `price`, `asin`, `recorded_at` (TIMESTAMPTZ).

### `stores`
* **Purpose**: E-commerce retailers (Amazon AE, Noon, Sharaf DG, etc.).
* **Key Fields**: `id`, `slug` (Unique), `name`, `logo_url`, `website_url`, `affiliate_base_url`, `is_active`, `is_featured`, `display_order`.

### `coupons`
* **Purpose**: Discount and promo codes.
* **Key Fields**: `id`, `store_id` (FK $\rightarrow$ stores), `code` (e.g. `TECH15`), `title_en`, `title_ar`, `discount_type` (`percent` | `fixed`), `discount_value`, `min_order_value`, `expires_at`, `is_verified`, `is_active`, `is_exclusive`, `source`, `click_count`.
* **Constraints**: Unique code per store enforced in import logic.

### `deals`
* **Purpose**: Flash sales and limited-time price drops.
* **Key Fields**: `id`, `product_id` (FK $\rightarrow$ products), `store_id` (FK $\rightarrow$ stores), `asin`, `deal_price`, `original_price`, `discount_percent`, `starts_at`, `expires_at`, `is_active`.

### `blog_posts`
* **Purpose**: Articles, buying guides, and reviews for SEO.
* **Key Fields**: `id`, `slug` (Unique), `title_en`, `title_ar`, `content_en` (HTML), `content_ar`, `excerpt_en`, `featured_image`, `author_id` (FK $\rightarrow$ profiles), `category_id`, `tags`, `post_type`, `seo_title_en`, `seo_description_en`, `schema_faq` (JSONB), `is_published`, `view_count`.

### `pages`
* **Purpose**: CMS dynamic static pages (About Us, Privacy Policy, Terms of Service, Cookie Policy, Affiliate Disclaimer).
* **Key Fields**: `id`, `slug` (Unique), `title_en`, `title_ar`, `content_en` (HTML), `content_ar`, `placement` (`footer_c1` | `footer_c2` | `footer_c3`), `is_active`, `is_visible`, `status` (`published` | `draft`).

### `settings`
* **Purpose**: Global key-value system configuration.
* **Key Fields**: `key` (PK), `value` (JSONB), `description`, `updated_at`. Contains site meta, social links, affiliate network IDs, and SEO settings.

### `coupon_imports`, `coupon_import_items`, `coupon_store_aliases`
* **Purpose**: Bulk CSV coupon import engine with staging and alias mapping.
* **Lifecycle**: `uploaded` $\rightarrow$ `analyzed` $\rightarrow$ `staged` $\rightarrow$ `committed`.

### `api_sync_logs`
* **Purpose**: Audit trail for automated price sync cron runs.
* **Key Fields**: `store_id`, `sync_type` (`price_update`), `status` (`success` | `partial` | `failed`), `records_updated`, `error_message`, `duration_ms`, `created_at`.

---

## 4. Row Level Security (RLS) Principles
* **Public Reads**: Anonymous and authenticated users have `SELECT` access to all active products, stores, coupons, deals, published blog posts, and visible pages.
* **Admin Writes**: `INSERT`, `UPDATE`, and `DELETE` on all core catalog tables are restricted to authenticated users with `app_metadata.role = 'admin'`.
* **Service Role Access**: Automated background tasks and server-side import services use the `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS safely.
