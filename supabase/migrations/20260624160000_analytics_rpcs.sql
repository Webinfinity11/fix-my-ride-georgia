-- Server-side analytics aggregation (admin only). Counts happen in the DB so
-- they are EXACT regardless of row volume / PostgREST max-rows caps.
-- Idempotent (CREATE OR REPLACE).

-- Daily counts for the last (2 * p_days) days (current + previous period for trend).
CREATE OR REPLACE FUNCTION public.get_admin_analytics(p_days int)
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
DECLARE
  v_start date := CURRENT_DATE - ((2 * p_days) - 1);
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH d AS (
    SELECT generate_series(v_start, CURRENT_DATE, interval '1 day')::date AS day
  ),
  sv AS (SELECT created_at::date AS day, count(*) c FROM service_views        WHERE created_at >= v_start GROUP BY 1),
  sc AS (SELECT created_at::date AS day, count(*) c FROM service_phone_views   WHERE created_at >= v_start GROUP BY 1),
  mc AS (SELECT created_at::date AS day, count(*) c FROM mechanic_phone_views  WHERE created_at >= v_start GROUP BY 1),
  pv AS (SELECT created_at::date AS day, count(*) c FROM mechanic_profile_views WHERE created_at >= v_start GROUP BY 1)
  SELECT d.day,
    COALESCE(sv.c, 0), COALESCE(sc.c, 0), COALESCE(mc.c, 0), COALESCE(pv.c, 0)
  FROM d
  LEFT JOIN sv ON sv.day = d.day
  LEFT JOIN sc ON sc.day = d.day
  LEFT JOIN mc ON mc.day = d.day
  LEFT JOIN pv ON pv.day = d.day
  ORDER BY d.day;
END;
$$;

-- Top services by call clicks within the last p_days (current period).
CREATE OR REPLACE FUNCTION public.get_top_called_services(p_days int, p_limit int)
RETURNS TABLE(service_id int, name text, calls bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT s.id, s.name, count(*)::bigint AS calls
  FROM service_phone_views v
  JOIN mechanic_services s ON s.id = v.service_id
  WHERE v.created_at >= now() - make_interval(days => p_days)
  GROUP BY s.id, s.name
  ORDER BY count(*) DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_analytics(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_called_services(int, int) TO authenticated;
