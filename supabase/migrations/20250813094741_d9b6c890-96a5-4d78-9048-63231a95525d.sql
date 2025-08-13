-- Fix RLS policies to allow public access to mechanic information

-- Drop overly restrictive policies on profiles
DROP POLICY IF EXISTS "Public can view verified mechanic basic info" ON public.profiles;

-- Create more permissive policy for mechanic profiles
CREATE POLICY "Anyone can view mechanic profiles" ON public.profiles
FOR SELECT 
USING (role = 'mechanic' OR auth.uid() = id OR is_admin(auth.uid()));

-- Drop overly restrictive policies on mechanic_profiles  
DROP POLICY IF EXISTS "Verified mechanic profiles are viewable by everyone" ON public.mechanic_profiles;

-- Create simpler policy for mechanic_profiles
CREATE POLICY "Anyone can view mechanic profiles" ON public.mechanic_profiles
FOR SELECT 
USING (true);

-- Ensure mechanic_services are publicly viewable
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.mechanic_services;
CREATE POLICY "Anyone can view services" ON public.mechanic_services
FOR SELECT 
USING (true);

-- Ensure reviews are publicly viewable
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Anyone can view reviews" ON public.reviews
FOR SELECT 
USING (true);

-- Ensure service_reviews are publicly viewable
DROP POLICY IF EXISTS "Anyone can view service reviews" ON public.service_reviews;
CREATE POLICY "Anyone can view service reviews" ON public.service_reviews
FOR SELECT 
USING (true);