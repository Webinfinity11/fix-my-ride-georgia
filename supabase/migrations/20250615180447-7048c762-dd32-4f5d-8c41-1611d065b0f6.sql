
-- სრულად წავშალოთ ყველა პოლიტიკა chat_participants-ზე
DROP POLICY IF EXISTS "Admin full access to chat_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view own participations" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can insert own participations" ON public.chat_participants;
DROP POLICY IF EXISTS "Admins can manage all chat_participants" ON public.chat_participants;

-- გავთიშოთ RLS
ALTER TABLE public.chat_participants DISABLE ROW LEVEL SECURITY;

-- წავშალოთ chat_rooms-ის პოლიტიკებიც
DROP POLICY IF EXISTS "Admin can view all chat_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Admins can view all chat_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Admins can create chat_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Admins can update chat_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Admins can delete chat_rooms" ON public.chat_rooms;

-- გავთიშოთ chat_rooms-ზეც RLS
ALTER TABLE public.chat_rooms DISABLE ROW LEVEL SECURITY;

-- ახლა შევქმნათ მარტივი, უსაფრთხო პოლიტიკები
-- chat_rooms-ისთვის
CREATE POLICY "Allow admin select chat_rooms"
  ON public.chat_rooms
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Allow admin insert chat_rooms"
  ON public.chat_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Allow admin update chat_rooms"
  ON public.chat_rooms
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Allow admin delete chat_rooms"
  ON public.chat_rooms
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ჩავრთოთ RLS chat_rooms-ზე
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- chat_participants-ისთვის ვარ შევქმნათ უბრალო პოლიტიკები
CREATE POLICY "Allow admin all chat_participants"
  ON public.chat_participants
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Allow users own chat_participants select"
  ON public.chat_participants
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow users own chat_participants insert"
  ON public.chat_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ჩავრთოთ RLS chat_participants-ზე
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
