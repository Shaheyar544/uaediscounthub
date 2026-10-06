-- Coupon bulk import foundation.
--
-- Safety invariant: deployment stops if legacy coupon rows cannot support
-- canonical (store_id, upper(btrim(code))) identity. This migration never
-- edits or deletes existing coupons as part of that reconciliation.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.coupons AS coupon
    LEFT JOIN public.stores AS store ON store.id = coupon.store_id
    WHERE coupon.store_id IS NULL OR store.id IS NULL
  ) THEN
    RAISE EXCEPTION
      'coupon bulk import foundation blocked: coupons with null or unresolved store_id must be reconciled before migration';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.coupons
    GROUP BY store_id, upper(btrim(code))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'coupon bulk import foundation blocked: duplicate (store_id, normalized code) rows must be reconciled before migration';
  END IF;
END
$$;

-- The partial predicate keeps this safe for any legacy nullable definition of
-- coupons.store_id while the preflight above prevents unresolved legacy rows.
CREATE UNIQUE INDEX IF NOT EXISTS coupons_store_normalized_code_key
  ON public.coupons (store_id, upper(btrim(code)))
  WHERE store_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.coupon_import_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(btrim(name)) > 0),
  source_label TEXT,
  expected_headers JSONB NOT NULL DEFAULT '[]'::jsonb,
  mapping_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  transform_options JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_store_id UUID REFERENCES public.stores(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupon_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'parsed', 'validated', 'committing', 'committed', 'failed',
    'rolled_back', 'rollback_failed', 'rollback_unsafe'
  )),
  source_file_name TEXT,
  source_file_hash TEXT NOT NULL CHECK (char_length(btrim(source_file_hash)) > 0),
  source_object_key TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('csv', 'xlsx', 'xls')),
  sheet_name TEXT,
  mapping_profile_id UUID REFERENCES public.coupon_import_profiles(id) ON DELETE SET NULL,
  mapping_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_version TEXT NOT NULL,
  validation_hash TEXT,
  total_row_count INTEGER NOT NULL DEFAULT 0 CHECK (total_row_count >= 0),
  valid_row_count INTEGER NOT NULL DEFAULT 0 CHECK (valid_row_count >= 0),
  invalid_row_count INTEGER NOT NULL DEFAULT 0 CHECK (invalid_row_count >= 0),
  duplicate_row_count INTEGER NOT NULL DEFAULT 0 CHECK (duplicate_row_count >= 0),
  skipped_row_count INTEGER NOT NULL DEFAULT 0 CHECK (skipped_row_count >= 0),
  inserted_row_count INTEGER NOT NULL DEFAULT 0 CHECK (inserted_row_count >= 0),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  parsed_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  committed_at TIMESTAMPTZ,
  committed_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  rollback_requested_at TIMESTAMPTZ,
  rollback_requested_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  rollback_error TEXT
);

CREATE TABLE IF NOT EXISTS public.coupon_import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES public.coupon_imports(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL CHECK (row_number > 0),
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  normalized_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  duplicate_fingerprint TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'valid', 'invalid', 'duplicate_in_file', 'duplicate_existing',
    'skipped', 'inserted', 'rolled_back', 'rollback_unsafe'
  )),
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  existing_coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  inserted_coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  inserted_coupon_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (import_id, row_number)
);

CREATE INDEX IF NOT EXISTS coupon_import_profiles_created_by_active_idx
  ON public.coupon_import_profiles (created_by, is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS coupon_imports_created_by_created_at_idx
  ON public.coupon_imports (created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS coupon_imports_status_created_at_idx
  ON public.coupon_imports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS coupon_import_rows_import_status_idx
  ON public.coupon_import_rows (import_id, status, row_number);
CREATE INDEX IF NOT EXISTS coupon_import_rows_fingerprint_idx
  ON public.coupon_import_rows (import_id, duplicate_fingerprint)
  WHERE duplicate_fingerprint IS NOT NULL;
CREATE INDEX IF NOT EXISTS coupon_import_rows_inserted_coupon_idx
  ON public.coupon_import_rows (inserted_coupon_id)
  WHERE inserted_coupon_id IS NOT NULL;

ALTER TABLE public.coupon_import_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_import_rows ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.coupon_import_profiles FROM anon;
REVOKE ALL ON TABLE public.coupon_imports FROM anon;
REVOKE ALL ON TABLE public.coupon_import_rows FROM anon;
REVOKE ALL ON TABLE public.coupon_import_profiles FROM authenticated;
REVOKE ALL ON TABLE public.coupon_imports FROM authenticated;
REVOKE ALL ON TABLE public.coupon_import_rows FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.coupon_import_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.coupon_imports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.coupon_import_rows TO authenticated;

DROP POLICY IF EXISTS "Admin full access coupon import profiles" ON public.coupon_import_profiles;
CREATE POLICY "Admin full access coupon import profiles"
  ON public.coupon_import_profiles FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admin full access coupon imports" ON public.coupon_imports;
CREATE POLICY "Admin full access coupon imports"
  ON public.coupon_imports FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admin full access coupon import rows" ON public.coupon_import_rows;
CREATE POLICY "Admin full access coupon import rows"
  ON public.coupon_import_rows FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE OR REPLACE FUNCTION public.commit_coupon_import(
  p_import_id UUID,
  p_validation_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_import public.coupon_imports%ROWTYPE;
  v_eligible_count INTEGER;
  v_inserted_count INTEGER;
  v_failure_reason TEXT;
BEGIN
  IF auth.uid() IS NULL
    OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' THEN
    RAISE EXCEPTION 'admin authorization is required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_import
  FROM public.coupon_imports
  WHERE id = p_import_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'coupon import not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_import.status <> 'validated'
    OR v_import.validation_hash IS NULL
    OR v_import.validation_hash IS DISTINCT FROM p_validation_hash THEN
    RAISE EXCEPTION 'coupon import is not in its validated state' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.coupon_imports
  SET status = 'committing', failure_reason = NULL, failed_at = NULL
  WHERE id = p_import_id;

  BEGIN
    SELECT count(*) INTO v_eligible_count
    FROM public.coupon_import_rows
    WHERE import_id = p_import_id AND status = 'valid';

    IF v_eligible_count = 0 THEN
      RAISE EXCEPTION 'coupon import has no eligible rows';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.coupon_import_rows AS row
      WHERE row.import_id = p_import_id
        AND row.status = 'valid'
        AND (
          coalesce(btrim(row.normalized_data ->> 'store_id'), '') = ''
          OR coalesce(btrim(row.normalized_data ->> 'code'), '') = ''
          OR coalesce(btrim(row.normalized_data ->> 'title_en'), '') = ''
          OR coalesce(btrim(row.normalized_data ->> 'discount_type'), '') NOT IN ('percent', 'fixed')
          OR coalesce(btrim(row.normalized_data ->> 'discount_value'), '') !~ '^[0-9]+(\.[0-9]+)?$'
          OR (row.normalized_data ->> 'discount_type') = 'percent'
             AND (row.normalized_data ->> 'discount_value')::numeric > 100
          OR (row.normalized_data ->> 'discount_value')::numeric <= 0
          OR coalesce(row.normalized_data ->> 'is_active', 'true') NOT IN ('true', 'false')
          OR coalesce(row.normalized_data ->> 'is_verified', 'false') NOT IN ('true', 'false')
          OR coalesce(row.normalized_data ->> 'is_exclusive', 'false') NOT IN ('true', 'false')
        )
    ) THEN
      RAISE EXCEPTION 'coupon import rows failed commit-time validation';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.coupon_import_rows AS row
      LEFT JOIN public.stores AS store ON store.id = (row.normalized_data ->> 'store_id')::uuid
      WHERE row.import_id = p_import_id
        AND row.status = 'valid'
        AND (store.id IS NULL OR store.is_active IS NOT TRUE)
    ) THEN
      RAISE EXCEPTION 'coupon import contains an invalid or inactive store';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.coupon_import_rows AS row
      WHERE row.import_id = p_import_id AND row.status = 'valid'
      GROUP BY (row.normalized_data ->> 'store_id')::uuid, upper(btrim(row.normalized_data ->> 'code'))
      HAVING count(*) > 1
    ) THEN
      RAISE EXCEPTION 'coupon import contains duplicate coupon identities';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.coupon_import_rows AS row
      JOIN public.coupons AS coupon
        ON coupon.store_id = (row.normalized_data ->> 'store_id')::uuid
       AND upper(btrim(coupon.code)) = upper(btrim(row.normalized_data ->> 'code'))
      WHERE row.import_id = p_import_id AND row.status = 'valid'
    ) THEN
      RAISE EXCEPTION 'coupon import duplicates an existing coupon';
    END IF;

    WITH inserted AS (
      INSERT INTO public.coupons (
        store_id, code, title_en, title_ar, description_en, description_ar,
        discount_type, discount_value, min_order_value, max_uses, current_uses,
        expires_at, is_verified, is_active, is_exclusive, product_id, source
      )
      SELECT
        (row.normalized_data ->> 'store_id')::uuid,
        upper(btrim(row.normalized_data ->> 'code')),
        btrim(row.normalized_data ->> 'title_en'),
        nullif(btrim(row.normalized_data ->> 'title_ar'), ''),
        nullif(btrim(row.normalized_data ->> 'description_en'), ''),
        nullif(btrim(row.normalized_data ->> 'description_ar'), ''),
        row.normalized_data ->> 'discount_type',
        (row.normalized_data ->> 'discount_value')::numeric,
        nullif(row.normalized_data ->> 'min_order_value', '')::numeric,
        nullif(row.normalized_data ->> 'max_uses', '')::integer,
        0,
        nullif(row.normalized_data ->> 'expires_at', '')::timestamptz,
        coalesce((row.normalized_data ->> 'is_verified')::boolean, FALSE),
        coalesce((row.normalized_data ->> 'is_active')::boolean, TRUE),
        coalesce((row.normalized_data ->> 'is_exclusive')::boolean, FALSE),
        nullif(row.normalized_data ->> 'product_id', '')::uuid,
        coalesce(nullif(btrim(row.normalized_data ->> 'source'), ''), 'bulk_import')
      FROM public.coupon_import_rows AS row
      WHERE row.import_id = p_import_id AND row.status = 'valid'
      RETURNING id, store_id, upper(btrim(code)) AS normalized_code
    )
    UPDATE public.coupon_import_rows AS row
    SET inserted_coupon_id = inserted.id,
        status = 'inserted',
        updated_at = now()
    FROM inserted
    WHERE row.import_id = p_import_id
      AND row.status = 'valid'
      AND (row.normalized_data ->> 'store_id')::uuid = inserted.store_id
      AND upper(btrim(row.normalized_data ->> 'code')) = inserted.normalized_code;

    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    IF v_inserted_count <> v_eligible_count THEN
      RAISE EXCEPTION 'coupon import inserted row count did not match eligible row count';
    END IF;

    UPDATE public.coupon_import_rows AS row
    SET inserted_coupon_snapshot = to_jsonb(coupon), updated_at = now()
    FROM public.coupons AS coupon
    WHERE row.import_id = p_import_id
      AND row.status = 'inserted'
      AND row.inserted_coupon_id = coupon.id;

    UPDATE public.coupon_imports
    SET status = 'committed',
        inserted_row_count = v_inserted_count,
        committed_at = now(),
        committed_by = auth.uid()
    WHERE id = p_import_id;

    RETURN jsonb_build_object('ok', TRUE, 'status', 'committed', 'inserted_row_count', v_inserted_count);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_failure_reason = MESSAGE_TEXT;
    UPDATE public.coupon_imports
    SET status = 'failed',
        failed_at = now(),
        failure_reason = left(v_failure_reason, 1000)
    WHERE id = p_import_id;

    RETURN jsonb_build_object('ok', FALSE, 'status', 'failed', 'error', 'commit_failed');
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.rollback_coupon_import(p_import_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_import public.coupon_imports%ROWTYPE;
  v_expected_count INTEGER;
  v_deleted_count INTEGER;
  v_failure_reason TEXT;
BEGIN
  IF auth.uid() IS NULL
    OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' THEN
    RAISE EXCEPTION 'admin authorization is required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_import
  FROM public.coupon_imports
  WHERE id = p_import_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'coupon import not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_import.status <> 'committed' THEN
    RAISE EXCEPTION 'only committed coupon imports can be rolled back' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.coupon_imports
  SET rollback_requested_at = now(), rollback_requested_by = auth.uid()
  WHERE id = p_import_id;

  IF EXISTS (
    SELECT 1
    FROM public.coupon_import_rows AS row
    LEFT JOIN public.coupons AS coupon ON coupon.id = row.inserted_coupon_id
    WHERE row.import_id = p_import_id
      AND row.status = 'inserted'
      AND (
        row.inserted_coupon_id IS NULL
        OR row.inserted_coupon_snapshot IS NULL
        OR coupon.id IS NULL
        OR to_jsonb(coupon) IS DISTINCT FROM row.inserted_coupon_snapshot
      )
  ) THEN
    UPDATE public.coupon_import_rows
    SET status = 'rollback_unsafe', updated_at = now()
    WHERE import_id = p_import_id AND status = 'inserted';

    UPDATE public.coupon_imports
    SET status = 'rollback_unsafe',
        rollback_error = 'Rollback refused because one or more imported coupons changed after commit.'
    WHERE id = p_import_id;

    RETURN jsonb_build_object('ok', FALSE, 'status', 'rollback_unsafe', 'error', 'rollback_unsafe');
  END IF;

  BEGIN
    SELECT count(*) INTO v_expected_count
    FROM public.coupon_import_rows
    WHERE import_id = p_import_id AND status = 'inserted';

    IF v_expected_count = 0 THEN
      RAISE EXCEPTION 'coupon import has no inserted coupons to roll back';
    END IF;

    DELETE FROM public.coupons AS coupon
    USING public.coupon_import_rows AS row
    WHERE row.import_id = p_import_id
      AND row.status = 'inserted'
      AND coupon.id = row.inserted_coupon_id;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    IF v_deleted_count <> v_expected_count THEN
      RAISE EXCEPTION 'coupon rollback deleted an unexpected number of coupons';
    END IF;

    UPDATE public.coupon_import_rows
    SET status = 'rolled_back', updated_at = now()
    WHERE import_id = p_import_id AND status = 'inserted';

    UPDATE public.coupon_imports
    SET status = 'rolled_back',
        rolled_back_at = now(),
        rolled_back_by = auth.uid(),
        rollback_error = NULL
    WHERE id = p_import_id;

    RETURN jsonb_build_object('ok', TRUE, 'status', 'rolled_back', 'deleted_row_count', v_deleted_count);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_failure_reason = MESSAGE_TEXT;
    UPDATE public.coupon_imports
    SET status = 'rollback_failed', rollback_error = left(v_failure_reason, 1000)
    WHERE id = p_import_id;

    RETURN jsonb_build_object('ok', FALSE, 'status', 'rollback_failed', 'error', 'rollback_failed');
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.commit_coupon_import(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rollback_coupon_import(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.commit_coupon_import(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_coupon_import(UUID) TO authenticated;
