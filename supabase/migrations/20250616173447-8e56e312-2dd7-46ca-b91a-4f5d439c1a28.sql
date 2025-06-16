
-- ჯერ წავშალოთ ყველა არსებული პრობლემური პოლიტიკა
DROP POLICY IF EXISTS "chat_rooms_admin_all" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_user_select" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_user_insert" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_participants_admin_all" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_user_select" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_user_insert" ON public.chat_participants;

-- გავთიშოთ RLS დროებით
ALTER TABLE public.chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants DISABLE ROW LEVEL SECURITY;

-- შევქმნათ უსაფრთხო security definer ფუნქცია მომხმარებლის როლის შესამოწმებლად
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- შევქმნათ ფუნქცია ადმინის შესამოწმებლად
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- შევქმნათ ფუნქცია იმის შესამოწმებლად მონაწილეობს თუ არა მომხმარებელი ჩატში
CREATE OR REPLACE FUNCTION public.user_participates_in_room(user_id uuid, room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_participants.user_id = user_participates_in_room.user_id 
    AND chat_participants.room_id = user_participates_in_room.room_id
  );
$$;

-- ახლა შევქმნათ უსაფრთხო პოლიტიკები chat_rooms-ისთვის
CREATE POLICY "chat_rooms_admin_access" 
  ON public.chat_rooms 
  FOR ALL 
  TO authenticated 
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));

CREATE POLICY "chat_rooms_public_select" 
  ON public.chat_rooms 
  FOR SELECT 
  TO authenticated 
  USING (
    is_public = true OR 
    created_by = auth.uid() OR
    public.user_participates_in_room(auth.uid(), id)
  );

CREATE POLICY "chat_rooms_creator_insert" 
  ON public.chat_rooms 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (created_by = auth.uid());

-- chat_participants-ისთვის უსაფრთხო პოლიტიკები
CREATE POLICY "chat_participants_admin_access" 
  ON public.chat_participants 
  FOR ALL 
  TO authenticated 
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));

CREATE POLICY "chat_participants_own_select" 
  ON public.chat_participants 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "chat_participants_own_insert" 
  ON public.chat_participants 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- ჩავრთოთ RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
