-- ============================================================
-- Harden RLS policies
--
-- Option B for core tables (categories, coupons, deals,
--   products, stores): split FOR ALL into operation-scoped
--   policies and gate writes on admin JWT claim.
--
-- Perf fix for blog/utility tables: split FOR ALL into
--   operation-scoped policies (authenticated, no JWT gate).
--
-- newsletter_subscribers: layered access model.
--
-- Admin JWT check uses (SELECT ...) subquery so the JWT is
-- evaluated once per query, not once per row.
-- Admin users must have app_metadata.role = 'admin' set in
-- Supabase Auth Dashboard for write policies to pass.
-- Admin panel code already uses service role (bypasses RLS),
-- so this adds defence-in-depth without breaking the UI.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- OPTION B — Core tables: admin-JWT-gated writes
-- Public SELECT policies are intentionally left unchanged.
-- ════════════════════════════════════════════════════════════

-- categories ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated full access categories" ON public.categories;

CREATE POLICY "categories_insert"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "categories_update"
  ON public.categories FOR UPDATE TO authenticated
  USING  ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "categories_delete"
  ON public.categories FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');


-- coupons ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated full access coupons" ON public.coupons;

CREATE POLICY "coupons_insert"
  ON public.coupons FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "coupons_update"
  ON public.coupons FOR UPDATE TO authenticated
  USING  ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "coupons_delete"
  ON public.coupons FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');


-- deals ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated full access deals" ON public.deals;

CREATE POLICY "deals_insert"
  ON public.deals FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "deals_update"
  ON public.deals FOR UPDATE TO authenticated
  USING  ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "deals_delete"
  ON public.deals FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');


-- products ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated full access products" ON public.products;

CREATE POLICY "products_insert"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "products_update"
  ON public.products FOR UPDATE TO authenticated
  USING  ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "products_delete"
  ON public.products FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');


-- stores ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated full access stores" ON public.stores;

CREATE POLICY "stores_insert"
  ON public.stores FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "stores_update"
  ON public.stores FOR UPDATE TO authenticated
  USING  ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "stores_delete"
  ON public.stores FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');


-- ════════════════════════════════════════════════════════════
-- PERF FIX — Blog/utility tables: operation-scoped (auth)
-- Wrapped in DO block with IF EXISTS guards.
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN

  -- blog_ad_widgets: drop FOR ALL, add 3 scoped policies
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'blog_ad_widgets'
  ) THEN
    DROP POLICY IF EXISTS "Auth manage ad widgets" ON public.blog_ad_widgets;

    CREATE POLICY "blog_ad_widgets_insert"
      ON public.blog_ad_widgets FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "blog_ad_widgets_update"
      ON public.blog_ad_widgets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "blog_ad_widgets_delete"
      ON public.blog_ad_widgets FOR DELETE TO authenticated USING (true);
  END IF;


  -- blog_categories
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'blog_categories'
  ) THEN
    DROP POLICY IF EXISTS "Auth manage blog cats" ON public.blog_categories;

    CREATE POLICY "blog_categories_insert"
      ON public.blog_categories FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "blog_categories_update"
      ON public.blog_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "blog_categories_delete"
      ON public.blog_categories FOR DELETE TO authenticated USING (true);
  END IF;


  -- blog_post_images
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'blog_post_images'
  ) THEN
    DROP POLICY IF EXISTS "Auth manage post images" ON public.blog_post_images;

    CREATE POLICY "blog_post_images_insert"
      ON public.blog_post_images FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "blog_post_images_update"
      ON public.blog_post_images FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "blog_post_images_delete"
      ON public.blog_post_images FOR DELETE TO authenticated USING (true);
  END IF;


  -- blog_post_tags
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'blog_post_tags'
  ) THEN
    DROP POLICY IF EXISTS "Auth manage post tags" ON public.blog_post_tags;

    CREATE POLICY "blog_post_tags_insert"
      ON public.blog_post_tags FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "blog_post_tags_update"
      ON public.blog_post_tags FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "blog_post_tags_delete"
      ON public.blog_post_tags FOR DELETE TO authenticated USING (true);
  END IF;


  -- blog_tags
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'blog_tags'
  ) THEN
    DROP POLICY IF EXISTS "Auth manage blog tags" ON public.blog_tags;

    CREATE POLICY "blog_tags_insert"
      ON public.blog_tags FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "blog_tags_update"
      ON public.blog_tags FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "blog_tags_delete"
      ON public.blog_tags FOR DELETE TO authenticated USING (true);
  END IF;


  -- brands: previously named "Admin manage brands" (ALL auth)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'brands'
  ) THEN
    DROP POLICY IF EXISTS "Admin manage brands" ON public.brands;

    CREATE POLICY "brands_insert"
      ON public.brands FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "brands_update"
      ON public.brands FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "brands_delete"
      ON public.brands FOR DELETE TO authenticated USING (true);
  END IF;


  -- community_reports: already has separate SELECT+INSERT (no overlap)
  -- Just add UPDATE + DELETE to complete CRUD for authenticated users
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'community_reports'
  ) THEN
    DROP POLICY IF EXISTS "community_reports_update" ON public.community_reports;
    DROP POLICY IF EXISTS "community_reports_delete" ON public.community_reports;

    CREATE POLICY "community_reports_update"
      ON public.community_reports FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "community_reports_delete"
      ON public.community_reports FOR DELETE TO authenticated USING (true);
  END IF;


  -- comparisons
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'comparisons'
  ) THEN
    DROP POLICY IF EXISTS "Auth manage comparisons" ON public.comparisons;

    CREATE POLICY "comparisons_insert"
      ON public.comparisons FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "comparisons_update"
      ON public.comparisons FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "comparisons_delete"
      ON public.comparisons FOR DELETE TO authenticated USING (true);
  END IF;

END $$;


-- ════════════════════════════════════════════════════════════
-- newsletter_subscribers — layered access model
--
-- anon:          INSERT only (public signup form)
-- authenticated: SELECT (admin dashboard list view)
-- admin-JWT:     UPDATE + DELETE only
--
-- "Anyone can subscribe" INSERT policy already exists — kept.
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "newsletter_subscribers_select" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_subscribers_select"
  ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "newsletter_subscribers_update" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_subscribers_update"
  ON public.newsletter_subscribers FOR UPDATE TO authenticated
  USING  ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "newsletter_subscribers_delete" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_subscribers_delete"
  ON public.newsletter_subscribers FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
