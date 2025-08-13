-- Create a view for public mechanic profiles to hide sensitive columns
CREATE OR REPLACE VIEW public.public_mechanic_profiles AS
SELECT 
  id,
  first_name,
  last_name,
  city,
  district,
  avatar_url,
  is_verified,
  role,
  created_at
FROM profiles
WHERE role = 'mechanic' 
  AND is_verified = true;

-- Grant select access to the view
GRANT SELECT ON public.public_mechanic_profiles TO anon, authenticated;

-- Also remove duplicate RLS policies on profiles table
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;