-- Custom date-range analytics + per-event drill-down (admin only).
-- Idempotent (CREATE OR REPLACE).

-- Daily counts for an arbitrary [p_from, p_to] date range.
CREATE OR REPLACE FUNCTION public.get_admin_analytics_range(p_from date, p_to date)
RETURNS TABLE(
  day date,
  service_views bigint,
  service_calls bigint,
  mechanic_calls bigint,
  profile_views bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH d AS (
    SELECT generate_series(p_from, p_to, interval '1 day')::date AS bucket
  ),
  sv AS (SELECT created_at::date AS bucket, count(*) AS c FROM service_views         WHERE created_at::date BETWEEN p_from AND p_to GROUP BY 1),
  sc AS (SELECT created_at::date AS bucket, count(*) AS c FROM service_phone_views    WHERE created_at::date BETWEEN p_from AND p_to GROUP BY 1),
  mc AS (SELECT created_at::date AS bucket, count(*) AS c FROM mechanic_phone_views   WHERE created_at::date BETWEEN p_from AND p_to GROUP BY 1),
  pv AS (SELECT created_at::date AS bucket, count(*) AS c FROM mechanic_profile_views WHERE created_at::date BETWEEN p_from AND p_to GROUP BY 1)
  SELECT d.bucket AS day,
    COALESCE(sv.c, 0), COALESCE(sc.c, 0), COALESCE(mc.c, 0), COALESCE(pv.c, 0)
  FROM d
  LEFT JOIN sv ON sv.bucket = d.bucket
  LEFT JOIN sc ON sc.bucket = d.bucket
  LEFT JOIN mc ON mc.bucket = d.bucket
  LEFT JOIN pv ON pv.bucket = d.bucket
  ORDER BY d.bucket;
END;
$$;

-- Per-event feed: who viewed / called which service or mechanic, in [p_from, p_to).
-- DROP first because the return type (added `link`) changed.
DROP FUNCTION IF EXISTS public.get_admin_events(timestamptz, timestamptz, int);
CREATE OR REPLACE FUNCTION public.get_admin_events(p_from timestamptz, p_to timestamptz, p_limit int)
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
  ) e
  ORDER BY e.ts DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_analytics_range(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_events(timestamptz, timestamptz, int) TO authenticated;
