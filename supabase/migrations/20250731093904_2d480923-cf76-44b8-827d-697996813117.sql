-- Fix RLS policies for chat functionality

-- 1. Allow everyone (including non-authenticated users) to view public channel messages
DROP POLICY IF EXISTS "Public channel messages are viewable by everyone" ON messages;
CREATE POLICY "Public channel messages are viewable by everyone" 
ON messages 
FOR SELECT 
USING (
  room_id IN (
    SELECT id FROM chat_rooms 
    WHERE type = 'channel' AND is_public = true
  )
);

-- 2. Allow everyone (including non-authenticated users) to view public channels
DROP POLICY IF EXISTS "Public channels are viewable by everyone" ON chat_rooms;
CREATE POLICY "Public channels are viewable by everyone" 
ON chat_rooms 
FOR SELECT 
USING (type = 'channel' AND is_public = true);

-- 3. Allow authenticated users to view any chat room (for direct messaging)
DROP POLICY IF EXISTS "Users can view chat rooms" ON chat_rooms;
CREATE POLICY "Authenticated users can view chat rooms" 
ON chat_rooms 
FOR SELECT 
TO authenticated
USING (true);

-- 4. Allow authenticated users to view messages in any room they participate in OR public channels
DROP POLICY IF EXISTS "Users can view messages in their chat rooms" ON messages;
CREATE POLICY "Users can view messages in their rooms or public channels" 
ON messages 
FOR SELECT 
TO authenticated
USING (
  -- Messages in public channels
  room_id IN (
    SELECT id FROM chat_rooms 
    WHERE type = 'channel' AND is_public = true
  )
  OR
  -- Messages in rooms where user is participant
  room_id IN (
    SELECT room_id FROM chat_participants 
    WHERE user_id = auth.uid()
  )
);

-- 5. Allow authenticated users to send messages to any room where they are participants
DROP POLICY IF EXISTS "Users can send messages to their chat rooms" ON messages;
CREATE POLICY "Users can send messages to their rooms" 
ON messages 
FOR INSERT 
TO authenticated
WITH CHECK (
  sender_id = auth.uid() 
  AND (
    -- Public channels (user will be auto-added as participant)
    room_id IN (
      SELECT id FROM chat_rooms 
      WHERE type = 'channel' AND is_public = true
    )
    OR
    -- Direct chats (user can create/join)
    room_id IN (
      SELECT id FROM chat_rooms 
      WHERE type = 'direct'
    )
  )
);

-- 6. Allow authenticated users to create direct chat participants for anyone
DROP POLICY IF EXISTS "chat_participants_insert" ON chat_participants;
CREATE POLICY "Users can create chat participants" 
ON chat_participants 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- User can add themselves to any room
  user_id = auth.uid()
  OR
  -- User can add others to direct chats they create
  room_id IN (
    SELECT id FROM chat_rooms 
    WHERE created_by = auth.uid() AND type = 'direct'
  )
  OR
  -- Admins can manage all
  is_current_user_admin()
);

-- 7. Allow authenticated users to view participants in rooms where they participate or public channels
DROP POLICY IF EXISTS "chat_participants_select" ON chat_participants;
CREATE POLICY "Users can view participants in accessible rooms" 
ON chat_participants 
FOR SELECT 
TO authenticated
USING (
  -- In rooms where user is participant
  room_id IN (
    SELECT room_id FROM chat_participants cp2 
    WHERE cp2.user_id = auth.uid()
  )
  OR
  -- In public channels
  room_id IN (
    SELECT id FROM chat_rooms 
    WHERE type = 'channel' AND is_public = true
  )
  OR
  -- Admins can see all
  is_current_user_admin()
);