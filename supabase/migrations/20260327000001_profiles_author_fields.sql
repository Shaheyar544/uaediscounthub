ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

UPDATE public.profiles
SET social_links = '{}'::jsonb
WHERE social_links IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN social_links SET DEFAULT '{}'::jsonb;

ALTER TABLE public.profiles
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;
CREATE POLICY "profiles_public_select"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
CREATE POLICY "profiles_self_insert"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update"
  ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_self_delete" ON public.profiles;
CREATE POLICY "profiles_self_delete"
  ON public.profiles FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = id);
