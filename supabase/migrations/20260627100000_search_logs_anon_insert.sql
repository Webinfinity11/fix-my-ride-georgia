-- Allow ANONYMOUS visitors (not just logged-in users) to log search queries.
-- Without this, search_logs INSERT is blocked by RLS for the `anon` role, so
-- the vast majority of real searches (anonymous visitors) were never recorded.
-- Idempotent.

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Table-level privilege for the public/anon roles.
GRANT INSERT ON public.search_logs TO anon, authenticated;

-- Recreate the INSERT policy, explicitly covering anon + authenticated.
DROP POLICY IF EXISTS "Anyone can insert search logs" ON public.search_logs;
CREATE POLICY "Anyone can insert search logs"
ON public.search_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
