
-- სრულად წავშალოთ ყველა პოლიტიკა და თავიდან შევქმნათ
DROP POLICY IF EXISTS "Admins can manage all chat_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create chat_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view their accessible chat_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Allow admin select chat_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Allow admin insert chat_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Allow admin update chat_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Allow admin delete chat_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Admin can view all chat_rooms" ON public.chat_rooms;

DROP POLICY IF EXISTS "Admins can manage all chat_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view participants of their rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Admin full access to chat_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view own participations" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can insert own participations" ON public.chat_participants;
DROP POLICY IF EXISTS "Allow admin all chat_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Allow users own chat_participants select" ON public.chat_participants;
DROP POLICY IF EXISTS "Allow users own chat_participants insert" ON public.chat_participants;

-- გავთიშოთ RLS
ALTER TABLE public.chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants DISABLE ROW LEVEL SECURITY;

-- ახლა შევქმნათ მარტივი, მუშა პოლიტიკები
-- chat_rooms-ისთვის
CREATE POLICY "chat_rooms_admin_all" 
  ON public.chat_rooms 
  FOR ALL 
  TO authenticated 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "chat_rooms_user_select" 
  ON public.chat_rooms 
  FOR SELECT 
  TO authenticated 
  USING (
    is_public = true OR 
    created_by = auth.uid() OR
    id IN (
      SELECT room_id FROM public.chat_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "chat_rooms_user_insert" 
  ON public.chat_rooms 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (created_by = auth.uid());

-- chat_participants-ისთვის
CREATE POLICY "chat_participants_admin_all" 
  ON public.chat_participants 
  FOR ALL 
  TO authenticated 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "chat_participants_user_select" 
  ON public.chat_participants 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "chat_participants_user_insert" 
  ON public.chat_participants 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- ჩავრთოთ RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
