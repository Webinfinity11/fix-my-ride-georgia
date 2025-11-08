-- Function to check and deactivate expired VIP services
CREATE OR REPLACE FUNCTION check_vip_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if VIP has expired
  IF NEW.vip_until IS NOT NULL AND NEW.vip_until < NOW() THEN
    NEW.is_vip_active = FALSE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Trigger to auto-deactivate expired VIP on UPDATE or INSERT
CREATE TRIGGER check_vip_expiration_trigger
BEFORE UPDATE OR INSERT ON mechanic_services
FOR EACH ROW
EXECUTE FUNCTION check_vip_expiration();

-- Batch cleanup function to expire all VIP services
CREATE OR REPLACE FUNCTION expire_vip_services()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE mechanic_services
  SET is_vip_active = FALSE
  WHERE vip_until IS NOT NULL 
    AND vip_until < NOW() 
    AND is_vip_active = TRUE;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';