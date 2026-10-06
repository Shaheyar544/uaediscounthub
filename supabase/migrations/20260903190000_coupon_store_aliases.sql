-- Admin-approved, reusable source-store aliases for coupon imports.
-- This additive migration never changes stores or coupons.

CREATE TABLE public.coupon_store_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_value TEXT NOT NULL CHECK (char_length(btrim(alias_value)) > 0),
  normalized_alias TEXT NOT NULL CHECK (char_length(btrim(normalized_alias)) > 0),
  store_id UUID REFERENCES public.stores(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('approved', 'rejected')),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reviewed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT coupon_store_aliases_decision_check CHECK (
    (status = 'approved' AND store_id IS NOT NULL)
    OR (status = 'rejected' AND store_id IS NULL)
  ),
  CONSTRAINT coupon_store_aliases_normalized_alias_key UNIQUE (normalized_alias)
);

CREATE INDEX coupon_store_aliases_approved_store_idx
  ON public.coupon_store_aliases (store_id, normalized_alias)
  WHERE status = 'approved';

ALTER TABLE public.coupon_store_aliases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.coupon_store_aliases FROM anon;
REVOKE ALL ON TABLE public.coupon_store_aliases FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.coupon_store_aliases TO authenticated;

CREATE POLICY "Admin full access coupon store aliases"
  ON public.coupon_store_aliases FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
