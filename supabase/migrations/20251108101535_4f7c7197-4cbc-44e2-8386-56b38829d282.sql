-- Function to allow admins to update VIP status
CREATE OR REPLACE FUNCTION update_service_vip_status(
  p_service_id INTEGER,
  p_vip_status TEXT,
  p_vip_until TIMESTAMPTZ,
  p_is_vip_active BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  -- Update the service VIP status
  UPDATE mechanic_services
  SET 
    vip_status = p_vip_status,
    vip_until = p_vip_until,
    is_vip_active = p_is_vip_active,
    updated_at = NOW()
  WHERE id = p_service_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Grant execute permission to authenticated users (admins will use this)
GRANT EXECUTE ON FUNCTION update_service_vip_status TO authenticated;