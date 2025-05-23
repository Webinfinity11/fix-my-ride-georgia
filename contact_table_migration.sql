
-- Create a table for storing contact form messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'unread',
  assigned_to UUID REFERENCES auth.users
);

-- Set up RLS policies
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow admin users to see all contact messages
CREATE POLICY "Admins can view all contact messages"
  ON public.contact_messages
  FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Allow users to create contact messages
CREATE POLICY "Users can create contact messages"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own contact messages
CREATE POLICY "Users can view own contact messages"
  ON public.contact_messages
  FOR SELECT
  USING (user_id = auth.uid());
