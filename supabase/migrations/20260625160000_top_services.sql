-- Top services by metric ('view' or 'call') within a date range (admin only).
-- Exact server-side aggregation (not limited by the event feed).
CREATE OR REPLACE FUNCTION public.get_top_services(p_metric text, p_from date, p_to date, p_limit int)
RETURNS TABLE(service_id int, name text, n bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_metric = 'view' THEN
    RETURN QUERY
    SELECT s.id, s.name, count(*)::bigint AS n
    FROM service_views v
    JOIN mechanic_services s ON s.id = v.service_id
    WHERE v.created_at::date BETWEEN p_from AND p_to
    GROUP BY s.id, s.name
    ORDER BY count(*) DESC
    LIMIT p_limit;
  ELSE
    RETURN QUERY
    SELECT s.id, s.name, count(*)::bigint AS n
    FROM service_phone_views v
    JOIN mechanic_services s ON s.id = v.service_id
    WHERE v.created_at::date BETWEEN p_from AND p_to
    GROUP BY s.id, s.name
    ORDER BY count(*) DESC
    LIMIT p_limit;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_services(text, date, date, int) TO authenticated;
