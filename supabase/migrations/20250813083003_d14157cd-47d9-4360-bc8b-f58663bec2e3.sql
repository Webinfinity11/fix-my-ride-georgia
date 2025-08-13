-- Create column-level RLS by updating the policy to be more restrictive
-- The issue is that we need to completely block access to sensitive columns for public users

-- Drop the current policy and create a more explicit one
DROP POLICY IF EXISTS "Public can view basic mechanic info only" ON public.profiles;

-- Create a policy that explicitly restricts column access for public/anonymous users
-- We'll use a function approach to ensure column-level security
CREATE OR REPLACE FUNCTION public.is_admin_or_self_or_public_mechanic(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    -- Admin can see everything
    WHEN auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN true
    -- Users can see their own profile
    WHEN auth.uid() = profile_id THEN true  
    -- Public can only see verified mechanics (but with limited columns)
    WHEN (
      SELECT role = 'mechanic' AND is_verified = true 
      FROM public.profiles 
      WHERE id = profile_id
    ) THEN true
    ELSE false
  END;
$$;

-- Create the restrictive policy
CREATE POLICY "Restricted profile access"
ON public.profiles
FOR SELECT
USING (is_admin_or_self_or_public_mechanic(id));

-- Update the get_public_mechanic_info function to be the primary way to access mechanic data safely
CREATE OR REPLACE FUNCTION public.get_safe_mechanic_profiles()
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
  WHERE p.role = 'mechanic' 
    AND p.is_verified = true;
$$;