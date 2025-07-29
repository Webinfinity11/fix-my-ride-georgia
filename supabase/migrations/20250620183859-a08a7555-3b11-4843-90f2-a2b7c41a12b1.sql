
-- გავასუფთავოთ ყველაფერი და თავიდან ვაწყოთ
ALTER TABLE public.chat_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms DISABLE ROW LEVEL SECURITY;

-- წავშალოთ ყველა პოლიტიკა
DROP POLICY IF EXISTS "chat_participants_select_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_insert_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_update_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_delete_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "admin_full_access_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "own_participation_read" ON public.chat_participants;
DROP POLICY IF EXISTS "own_participation_insert" ON public.chat_participants;

DROP POLICY IF EXISTS "admin_full_access_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "public_rooms_read" ON public.chat_rooms;
DROP POLICY IF EXISTS "creator_rooms_access" ON public.chat_rooms;

-- წავშალოთ არსებული ფუნქციები
DROP FUNCTION IF EXISTS public.can_access_chat_participants(uuid);

-- შევქმნათ ახალი მარტივი ფუნქცია ადმინისთვის
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM profiles WHERE id = auth.uid()), 
    false
  );
$$;

-- chat_rooms-ისთვის მარტივი პოლიტიკები
CREATE POLICY "allow_admin_all_chat_rooms" 
  ON public.chat_rooms 
  FOR ALL 
  TO authenticated 
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "allow_users_read_public_rooms" 
  ON public.chat_rooms 
  FOR SELECT 
  TO authenticated 
  USING (is_public = true OR public.is_current_user_admin());

-- chat_participants-ისთვის მარტივი პოლიტიკები
CREATE POLICY "allow_admin_all_participants" 
  ON public.chat_participants 
  FOR ALL 
  TO authenticated 
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "allow_users_own_participation" 
  ON public.chat_participants 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid() OR public.is_current_user_admin());

CREATE POLICY "allow_users_join_chats" 
  ON public.chat_participants 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid() OR public.is_current_user_admin());

-- ჩავრთოთ RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
