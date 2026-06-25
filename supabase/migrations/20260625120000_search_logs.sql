-- Per-event search log: every query a user types in a search field.
-- Idempotent.
CREATE TABLE IF NOT EXISTS public.search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  source TEXT,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON public.search_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON public.search_logs(query);

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert search logs" ON public.search_logs;
CREATE POLICY "Anyone can insert search logs"
ON public.search_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view search logs" ON public.search_logs;
CREATE POLICY "Admins can view search logs"
ON public.search_logs FOR SELECT
USING (public.is_admin(auth.uid()));

-- Add search events to the admin event feed (kind = 'ძიება').
DROP FUNCTION IF EXISTS public.get_admin_events(timestamptz, timestamptz, int);
CREATE FUNCTION public.get_admin_events(p_from timestamptz, p_to timestamptz, p_limit int)
RETURNS TABLE(ts timestamptz, kind text, target text, viewer text, link text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT * FROM (
    SELECT sv.created_at AS ts, 'ნახვა'::text AS kind, s.name AS target,
           COALESCE(NULLIF(TRIM(p.first_name || ' ' || p.last_name), ''), 'ანონიმური') AS viewer,
           ('/service/' || s.id::text) AS link
    FROM service_views sv
    JOIN mechanic_services s ON s.id = sv.service_id
    LEFT JOIN profiles p ON p.id = sv.viewer_id
    WHERE sv.created_at >= p_from AND sv.created_at < p_to

    UNION ALL
    SELECT v.created_at, 'დარეკვა'::text, s.name,
           COALESCE(NULLIF(TRIM(p.first_name || ' ' || p.last_name), ''), 'ანონიმური'),
           ('/service/' || s.id::text)
    FROM service_phone_views v
    JOIN mechanic_services s ON s.id = v.service_id
    LEFT JOIN profiles p ON p.id = v.viewer_id
    WHERE v.created_at >= p_from AND v.created_at < p_to

    UNION ALL
    SELECT m.created_at, 'დარეკვა (ხელოსანი)'::text,
           TRIM(mp.first_name || ' ' || mp.last_name),
           COALESCE(NULLIF(TRIM(p.first_name || ' ' || p.last_name), ''), 'ანონიმური'),
           ('/mechanic/' || COALESCE(mpr.display_id::text, ''))
    FROM mechanic_phone_views m
    JOIN profiles mp ON mp.id = m.mechanic_id
    LEFT JOIN mechanic_profiles mpr ON mpr.id = m.mechanic_id
    LEFT JOIN profiles p ON p.id = m.viewer_id
    WHERE m.created_at >= p_from AND m.created_at < p_to

    UNION ALL
    SELECT sl.created_at, 'ძიება'::text, sl.query,
           COALESCE(NULLIF(TRIM(p.first_name || ' ' || p.last_name), ''), 'ანონიმური'),
           ('/service-search?q=' || sl.query)
    FROM search_logs sl
    LEFT JOIN profiles p ON p.id = sl.viewer_id
    WHERE sl.created_at >= p_from AND sl.created_at < p_to
  ) e
  ORDER BY e.ts DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_events(timestamptz, timestamptz, int) TO authenticated;
