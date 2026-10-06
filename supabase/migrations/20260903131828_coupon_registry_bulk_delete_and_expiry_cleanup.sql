-- Enable scheduled removal of expired coupons while preserving report and usage history.
CREATE EXTENSION IF NOT EXISTS pg_cron;

ALTER TABLE public.coupon_usage
  DROP CONSTRAINT IF EXISTS coupon_usage_coupon_id_fkey;
ALTER TABLE public.coupon_usage
  ADD CONSTRAINT coupon_usage_coupon_id_fkey
  FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE SET NULL;

ALTER TABLE public.community_reports
  DROP CONSTRAINT IF EXISTS community_reports_coupon_id_fkey;
ALTER TABLE public.community_reports
  ADD CONSTRAINT community_reports_coupon_id_fkey
  FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS coupons_expired_cleanup_idx
  ON public.coupons (expires_at)
  WHERE expires_at IS NOT NULL;

DO $$
DECLARE
  existing_job_id bigint;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'delete-expired-coupons';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'delete-expired-coupons',
    '*/15 * * * *',
    $cleanup$DELETE FROM public.coupons WHERE expires_at IS NOT NULL AND expires_at <= now()$cleanup$
  );
END
$$;
