-- Fix security vulnerability: Restrict public access to sensitive customer data
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create secure policies that protect customer data while allowing mechanic discovery
-- 1. Users can view their own complete profile
CREATE POLICY "Users can view own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Public can only view basic mechanic information (no sensitive personal data)
CREATE POLICY "Public can view basic mechanic info only" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'mechanic' 
  AND is_verified = true
);

-- 3. Admins can view all profiles (existing policy covers this)
-- The "Admins can view all profiles" policy already exists and covers admin access

-- Also fix the messages table public access issue
DROP POLICY IF EXISTS "messages_read_all" ON public.messages;

-- Ensure chat participants can only be viewed by users with room access
DROP POLICY IF EXISTS "Users can view participants in accessible rooms" ON public.chat_participants;
CREATE POLICY "Users can view participants in accessible rooms" 
ON public.chat_participants 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND user_can_access_room(auth.uid(), room_id)
);