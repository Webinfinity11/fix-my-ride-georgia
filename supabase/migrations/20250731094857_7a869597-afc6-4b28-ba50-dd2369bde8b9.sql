-- Fix infinite recursion in chat_participants policies by creating security definer functions

-- Function to check if user can access a chat room
CREATE OR REPLACE FUNCTION public.user_can_access_room(user_id uuid, room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    -- User is a participant in the room
    SELECT 1 FROM chat_participants 
    WHERE chat_participants.user_id = user_can_access_room.user_id 
    AND chat_participants.room_id = user_can_access_room.room_id
  ) OR EXISTS (
    -- Room is a public channel
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = user_can_access_room.room_id 
    AND chat_rooms.type = 'channel' 
    AND chat_rooms.is_public = true
  ) OR (
    -- User is admin
    SELECT is_current_user_admin()
  );
$$;

-- Function to check if user can create participant for a room
CREATE OR REPLACE FUNCTION public.user_can_create_participant(user_id uuid, room_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT (
    -- User is adding themselves
    target_user_id = user_id
  ) OR EXISTS (
    -- User created this room and it's direct
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = user_can_create_participant.room_id 
    AND chat_rooms.created_by = user_id 
    AND chat_rooms.type = 'direct'
  ) OR (
    -- User is admin
    SELECT is_current_user_admin()
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view participants in accessible rooms" ON chat_participants;
DROP POLICY IF EXISTS "Users can create chat participants" ON chat_participants;

-- Create new policies using security definer functions
CREATE POLICY "Users can view participants in accessible rooms"
ON chat_participants
FOR SELECT
USING (user_can_access_room(auth.uid(), room_id));

CREATE POLICY "Users can create chat participants"
ON chat_participants
FOR INSERT
WITH CHECK (user_can_create_participant(auth.uid(), room_id, user_id));