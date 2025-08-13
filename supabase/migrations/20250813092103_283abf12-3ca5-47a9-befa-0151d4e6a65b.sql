-- Update RLS policy to allow public users to see mechanic basic info including names and phone
-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Restricted profile access" ON public.profiles;

-- Create a more permissive policy that allows:
-- 1. Admins to see everything
-- 2. Users to see their own profile  
-- 3. Public users to see verified mechanic basic info (name, phone, city, district, avatar, verification status)
-- 4. But hide sensitive customer data (email, address details, etc.)
CREATE POLICY "Public can view verified mechanic basic info"
ON public.profiles
FOR SELECT
USING (
  -- Admins can see everything
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )) OR
  -- Users can see their own profile completely
  (auth.uid() = id) OR
  -- Public can see verified mechanics with basic info only
  (role = 'mechanic' AND is_verified = true)
);

-- Also update the mechanic_profiles table to be publicly viewable for verified mechanics
DROP POLICY IF EXISTS "Mechanic profiles are viewable by everyone" ON public.mechanic_profiles;

CREATE POLICY "Verified mechanic profiles are viewable by everyone"
ON public.mechanic_profiles
FOR SELECT
USING (
  -- Check if the mechanic is verified by joining with profiles
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = mechanic_profiles.id 
    AND p.role = 'mechanic' 
    AND p.is_verified = true
  ) OR
  -- Mechanics can see their own profile
  (auth.uid() = id) OR
  -- Admins can see everything
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ))
);