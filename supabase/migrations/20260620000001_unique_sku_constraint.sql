-- Enforce uniqueness of SKU (ASIN) in products table at database level
-- This prevents duplicate product listings from being created in the future.

ALTER TABLE public.products ADD CONSTRAINT products_sku_key UNIQUE (sku);

CREATE UNIQUE INDEX IF NOT EXISTS products_asin_unique_idx ON public.products (asin) WHERE asin IS NOT NULL;
