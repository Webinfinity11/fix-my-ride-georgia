
-- ჯერ ყველაფერი წავშალოთ და თავიდან ვიწყოთ
DROP POLICY IF EXISTS "chat_rooms_admin_access" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_public_select" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_creator_insert" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_participants_admin_access" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_own_select" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_own_insert" ON public.chat_participants;

-- მესიჯების პოლიტიკებიც წავშალოთ
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;

-- RLS გავთიშოთ დროებით
ALTER TABLE public.chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- წავშალოთ ძველი ფუნქციები
DROP FUNCTION IF EXISTS public.user_participates_in_room(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_user_admin(uuid);
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- შევქმნათ მარტივი ადმინ შემოწმების ფუნქცია
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  END;
$$;

-- მარტივი პოლიტიკები chat_rooms-ისთვის
CREATE POLICY "admin_full_access_rooms" 
  ON public.chat_rooms 
  FOR ALL 
  TO authenticated 
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

CREATE POLICY "public_rooms_read" 
  ON public.chat_rooms 
  FOR SELECT 
  TO authenticated 
  USING (is_public = true);

CREATE POLICY "creator_rooms_access" 
  ON public.chat_rooms 
  FOR ALL 
  TO authenticated 
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- მარტივი პოლიტიკები chat_participants-ისთვის
CREATE POLICY "admin_full_access_participants" 
  ON public.chat_participants 
  FOR ALL 
  TO authenticated 
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

CREATE POLICY "own_participation_read" 
  ON public.chat_participants 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "own_participation_insert" 
  ON public.chat_participants 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- მარტივი პოლიტიკები messages-ისთვის
CREATE POLICY "admin_full_access_messages" 
  ON public.messages 
  FOR ALL 
  TO authenticated 
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

CREATE POLICY "own_messages_insert" 
  ON public.messages 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_read_all" 
  ON public.messages 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- RLS ჩავრთოთ
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
