-- Full activity (views + calls) for one service within a date range (admin only).
CREATE OR REPLACE FUNCTION public.get_service_activity(p_service_id int, p_from timestamptz, p_to timestamptz, p_limit int)
RETURNS TABLE(ts timestamptz, kind text, viewer text)
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
    SELECT sv.created_at AS ts, 'ნახვა'::text AS kind,
           COALESCE(NULLIF(TRIM(p.first_name || ' ' || p.last_name), ''), 'ანონიმური') AS viewer
    FROM service_views sv
    LEFT JOIN profiles p ON p.id = sv.viewer_id
    WHERE sv.service_id = p_service_id AND sv.created_at >= p_from AND sv.created_at < p_to

    UNION ALL
    SELECT v.created_at, 'დარეკვა'::text,
           COALESCE(NULLIF(TRIM(p.first_name || ' ' || p.last_name), ''), 'ანონიმური')
    FROM service_phone_views v
    LEFT JOIN profiles p ON p.id = v.viewer_id
    WHERE v.service_id = p_service_id AND v.created_at >= p_from AND v.created_at < p_to
  ) e
  ORDER BY e.ts DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_service_activity(int, timestamptz, timestamptz, int) TO authenticated;
