
-- წავშალოთ ყველა არსებული პოლიტიკა chat_participants ცხრილიდან
DROP POLICY IF EXISTS "Admins can manage all chat_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view own participations" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can create own participations" ON public.chat_participants;

-- გავთიშოთ RLS chat_participants ცხრილზე
ALTER TABLE public.chat_participants DISABLE ROW LEVEL SECURITY;

-- ახლა შევქმნათ უსაფრთხო პოლიტიკები
-- ადმინისტრატორებს ყველაფერზე უფლება
CREATE POLICY "Admin full access to chat_participants"
  ON public.chat_participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- მომხმარებლებს საკუთარი მონაწილეობების ნახვა
CREATE POLICY "Users can view own participations"
  ON public.chat_participants
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- მომხმარებლებს საკუთარი მონაწილეობების დამატება
CREATE POLICY "Users can insert own participations"
  ON public.chat_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ახლა ვთიშოთ და ხელახლა ჩავრთოთ RLS
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- ასევე შევამოწმოთ chat_rooms ცხრილის პოლიტიკები
-- წავშალოთ "Admins can view all chat_rooms" თუ არსებობს
DROP POLICY IF EXISTS "Admins can view all chat_rooms" ON public.chat_rooms;

-- შევქმნათ ახალი უსაფრთხო პოლიტიკა chat_rooms-ისთვის
CREATE POLICY "Admin can view all chat_rooms"
  ON public.chat_rooms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
