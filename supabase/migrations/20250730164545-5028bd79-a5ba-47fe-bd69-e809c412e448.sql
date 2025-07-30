-- Allow anyone to view public channels (for unregistered users too)
-- Update RLS policies for messages table to allow public channel viewing

-- First, let's add a policy for public channels viewing for non-authenticated users
CREATE POLICY "Public channels are viewable by everyone"
ON public.chat_rooms
FOR SELECT
USING (type = 'channel' AND is_public = true);

-- Update messages policy to allow viewing of public channel messages by anyone
CREATE POLICY "Public channel messages are viewable by everyone"
ON public.messages
FOR SELECT
USING (room_id IN (
  SELECT id FROM chat_rooms 
  WHERE type = 'channel' AND is_public = true
));

-- Filter direct chats to only show rooms with actual messages
-- This will be handled in the application logic, not in RLS