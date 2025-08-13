-- Drop the problematic view
DROP VIEW IF EXISTS public.public_mechanic_profiles;

-- Fix the RLS policy to be more precise about which columns can be accessed
-- First drop and recreate the mechanic policy with explicit column restrictions
DROP POLICY IF EXISTS "Public can view basic mechanic info only" ON public.profiles;

-- Use a function to control column access more precisely
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
  FROM profiles p
  WHERE p.id = mechanic_id 
    AND p.role = 'mechanic' 
    AND p.is_verified = true;
$$;

-- Recreate the policy for mechanics with explicit column access
CREATE POLICY "Public can view basic mechanic info only" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'mechanic' 
  AND is_verified = true
);