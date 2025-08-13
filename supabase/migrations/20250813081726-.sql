-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.get_public_mechanic_info(mechanic_id uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  city text,
  district text,
  avatar_url text,
  is_verified boolean,
  role user_role,
  created_at timestamptz
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.city,
    p.district,
    p.avatar_url,
    p.is_verified,
    p.role,
    p.created_at
  FROM public.profiles p
  WHERE p.id = mechanic_id 
    AND p.role = 'mechanic' 
    AND p.is_verified = true;
$$;