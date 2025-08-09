-- Fix RLS policies to allow anonymous users to view public channels
-- First, drop the conflicting policies
DROP POLICY IF EXISTS "Authenticated users can view chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Public channels are viewable by everyone" ON public.chat_rooms;

-- Create a single comprehensive policy for viewing chat rooms
CREATE POLICY "Anyone can view public channels, authenticated users can view all accessible rooms" 
ON public.chat_rooms 
FOR SELECT 
USING (
  -- Public channels are viewable by everyone (including anonymous users)
  ((type = 'channel') AND (is_public = true))
  OR
  -- Authenticated users can view rooms they have access to
  (auth.uid() IS NOT NULL AND (
    -- Rooms they created
    (created_by = auth.uid())
    OR
    -- Rooms they are participants in
    (id IN (
      SELECT room_id FROM chat_participants 
      WHERE user_id = auth.uid()
    ))
    OR
    -- Admins can see everything
    is_current_user_admin()
  ))
);