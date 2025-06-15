
-- შევქმნათ უსაფრთხოების DEFINER ფუნქცია, თუ არ გაქვს უკვე
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- წავშალოთ პრობლემური პოლიტიკები chat_participants-ზე, რომ აღარ მოხდეს რეკურსია
DROP POLICY IF EXISTS "Admins can view all chat_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Admins can manage all chat_participants" ON public.chat_participants;

-- ჩავწეროთ სწორი პოლიტიკები შემდეგნაირად:
-- ადმინისტრატორებმა ნახონ ყველა ჩანაწერი
CREATE POLICY "Admins can view all chat_participants"
  ON public.chat_participants
  FOR SELECT
  USING (public.get_current_user_role() = 'admin');

-- მომხმარებელმა ნახოს მხოლოდ საკუთარი ჩანაწერი
CREATE POLICY "Users can view their own chat_participants"
  ON public.chat_participants
  FOR SELECT
  USING (user_id = auth.uid());

-- მომხმარებელმა დაამატოს მხოლოდ საკუთარი თავი
CREATE POLICY "Users can create chat_participants"
  ON public.chat_participants
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
