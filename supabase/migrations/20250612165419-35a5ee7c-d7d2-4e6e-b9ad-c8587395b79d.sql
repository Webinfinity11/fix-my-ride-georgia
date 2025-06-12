
-- Create chat-files storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for chat-files bucket
CREATE POLICY "Anyone can view chat files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-files');

CREATE POLICY "Authenticated users can upload chat files" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Users can update their own chat files" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own chat files" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable RLS on chat tables if not already enabled
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_rooms
CREATE POLICY "Users can view public chat rooms" 
ON public.chat_rooms 
FOR SELECT 
TO authenticated 
USING (is_public = true OR id IN (
  SELECT room_id FROM chat_participants WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage all chat rooms" 
ON public.chat_rooms 
FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can create chat rooms" 
ON public.chat_rooms 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

-- Create RLS policies for chat_participants
CREATE POLICY "Users can view chat participants in their rooms" 
ON public.chat_participants 
FOR SELECT 
TO authenticated 
USING (room_id IN (
  SELECT room_id FROM chat_participants WHERE user_id = auth.uid()
) OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all chat participants" 
ON public.chat_participants 
FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can join public chat rooms" 
ON public.chat_participants 
FOR INSERT 
TO authenticated 
WITH CHECK (
  room_id IN (SELECT id FROM chat_rooms WHERE is_public = true) 
  OR public.is_admin(auth.uid())
);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages in their chat rooms" 
ON public.messages 
FOR SELECT 
TO authenticated 
USING (room_id IN (
  SELECT room_id FROM chat_participants WHERE user_id = auth.uid()
) OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all messages" 
ON public.messages 
FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can send messages to their chat rooms" 
ON public.messages 
FOR INSERT 
TO authenticated 
WITH CHECK (
  sender_id = auth.uid() AND 
  room_id IN (SELECT room_id FROM chat_participants WHERE user_id = auth.uid())
);

-- Create RLS policies for user_presence
CREATE POLICY "Everyone can view user presence" 
ON public.user_presence 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update their own presence" 
ON public.user_presence 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add file-related columns to messages table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'file_url') THEN
    ALTER TABLE public.messages ADD COLUMN file_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'file_type') THEN
    ALTER TABLE public.messages ADD COLUMN file_type TEXT CHECK (file_type IN ('image', 'video', 'file'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'file_name') THEN
    ALTER TABLE public.messages ADD COLUMN file_name TEXT;
  END IF;
END
$$;
