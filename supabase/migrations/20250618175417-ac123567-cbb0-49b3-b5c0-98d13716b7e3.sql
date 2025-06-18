
-- Drop ALL existing policies on chat_participants table
DROP POLICY IF EXISTS "chat_participants_select_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_insert_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_update_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_delete_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "admin_full_access_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "own_participation_read" ON public.chat_participants;
DROP POLICY IF EXISTS "own_participation_insert" ON public.chat_participants;

-- Drop the function if it exists and recreate it
DROP FUNCTION IF EXISTS public.can_access_chat_participants(uuid);

-- Create a simple function to check if user can access chat participants
CREATE OR REPLACE FUNCTION public.can_access_chat_participants(participant_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    CASE 
      WHEN auth.uid() IS NULL THEN false
      WHEN auth.uid() = participant_user_id THEN true
      WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN true
      ELSE false
    END;
$$;

-- Create new non-recursive policies for chat_participants
CREATE POLICY "chat_participants_select_policy" 
  ON public.chat_participants 
  FOR SELECT 
  TO authenticated 
  USING (public.can_access_chat_participants(user_id));

CREATE POLICY "chat_participants_insert_policy" 
  ON public.chat_participants 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_participants_update_policy" 
  ON public.chat_participants 
  FOR UPDATE 
  TO authenticated 
  USING (public.can_access_chat_participants(user_id))
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_participants_delete_policy" 
  ON public.chat_participants 
  FOR DELETE 
  TO authenticated 
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
