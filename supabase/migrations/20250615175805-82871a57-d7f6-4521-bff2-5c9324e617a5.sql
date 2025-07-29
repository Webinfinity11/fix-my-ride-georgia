
-- ჯერ წავშალოთ არსებული პრობლემური პოლიტიკები chat_participants ცხრილიდან
DROP POLICY IF EXISTS "Users can view their own participations" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can create their own participations" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can update their own participations" ON public.chat_participants;
DROP POLICY IF EXISTS "Admins can view all participations" ON public.chat_participants;
DROP POLICY IF EXISTS "Admins can create participations" ON public.chat_participants;
DROP POLICY IF EXISTS "Admins can update participations" ON public.chat_participants;
DROP POLICY IF EXISTS "Admins can delete participations" ON public.chat_participants;

-- ახლა შევქმნათ უსაფრთხო პოლიტიკები chat_participants-ისთვის
-- ადმინისტრატორებს ყველაფერზე უფლება
CREATE POLICY "Admins can manage all chat_participants"
  ON public.chat_participants
  FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- მომხმარებლებს მხოლოდ საკუთარი მონაწილეობების ნახვის უფლება
CREATE POLICY "Users can view own participations"
  ON public.chat_participants
  FOR SELECT
  USING (user_id = auth.uid());

-- მომხმარებლებს მხოლოდ საკუთარი მონაწილეობების შექმნის უფლება
CREATE POLICY "Users can create own participations"
  ON public.chat_participants
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS ჩართვა chat_participants ცხრილზე
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
