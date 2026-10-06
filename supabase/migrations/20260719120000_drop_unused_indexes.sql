-- Drop redundant/unused secondary indexes to reduce write amplification and bloat.
--
-- Rationale (measured via `supabase inspect db index-usage` on 2026-07-19):
--   Every INSERT must update every index. The price-update cron
--   writes to price_history / product_store_prices frequently, so unused indexes
--   there are pure write overhead on the free-tier compute.
--
-- SAFETY: This drops ONLY plain secondary indexes that had 0 scans over the
-- 132-day stats window. It deliberately does NOT touch any PRIMARY KEY (*_pkey)
-- or UNIQUE constraint (*_key) — those enforce data integrity regardless of read
-- usage. All drops are reversible (recreate the index) and use IF EXISTS.

-- price_history: 5 indexes, only idx_price_history_product_date is used.
-- These 4 are unused duplicates / redundant (highest-write table -> biggest win).
DROP INDEX IF EXISTS public.idx_price_history_product;
-- (product_id,store_id,recorded_at) dup, 0 scans
DROP INDEX IF EXISTS public.idx_price_history_lookup;
-- (product_id,store_id,recorded_at) dup, 0 scans
DROP INDEX IF EXISTS public.idx_ph_product;
-- (product_id,recorded_at) exact dup of the used index
DROP INDEX IF EXISTS public.idx_ph_store;
-- (store_id) 0 scans

-- product_store_prices: composite unique key covers product_id prefix already.
DROP INDEX IF EXISTS public.idx_psp_product;
-- (product_id) redundant with composite unique, 0 scans
DROP INDEX IF EXISTS public.idx_psp_store;
-- (store_id) 0 scans

-- products: unused secondary filter indexes (table is tiny; seq scan is cheap).
DROP INDEX IF EXISTS public.idx_products_featured;
-- (is_featured) 0 scans
DROP INDEX IF EXISTS public.idx_products_trending;
-- (is_trending) 0 scans
DROP INDEX IF EXISTS public.idx_products_brand;
-- (brand_id) 0 scans
DROP INDEX IF EXISTS public.idx_products_category;
-- (category_id) 0 scans

-- coupons / deals / affiliate_clicks: unused secondary indexes.
DROP INDEX IF EXISTS public.idx_coupons_active;
-- (is_active,expires_at) 0 scans
DROP INDEX IF EXISTS public.deals_active_discount_idx;
-- (discount_percent) 0 scans
DROP INDEX IF EXISTS public.idx_clicks_date;
-- (clicked_at) 0 scans

-- blog_posts: unused secondary indexes.
DROP INDEX IF EXISTS public.blog_posts_is_featured_idx;
-- (is_featured) 0 scans
DROP INDEX IF EXISTS public.blog_posts_category_id_idx;
-- (category_id) 0 scans
DROP INDEX IF EXISTS public.blog_posts_published_at_idx;
-- (published_at) 0 scans
