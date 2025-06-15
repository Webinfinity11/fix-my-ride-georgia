
-- ადმინისტრატორებმა შეძლონ ახალი chat_rooms-ის შექმნა
CREATE POLICY "Admins can create chat_rooms"
  ON public.chat_rooms
  FOR INSERT
  WITH CHECK (public.get_current_user_role() = 'admin');

-- ადმინისტრატორებმა შეძლონ chat_rooms-ის განახლება
CREATE POLICY "Admins can update chat_rooms"
  ON public.chat_rooms
  FOR UPDATE
  USING (public.get_current_user_role() = 'admin');

-- ადმინისტრატორებმა შეძლონ chat_rooms-ის წაშლა
CREATE POLICY "Admins can delete chat_rooms"
  ON public.chat_rooms
  FOR DELETE
  USING (public.get_current_user_role() = 'admin');
