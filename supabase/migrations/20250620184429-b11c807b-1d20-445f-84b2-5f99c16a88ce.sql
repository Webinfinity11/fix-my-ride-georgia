
-- განვაახლოთ chat_rooms პოლიტიკები, რომ ყველა ავტორიზებულმა მომხმარებელმა შეძლოს ჩატის შექმნა
DROP POLICY IF EXISTS "allow_admin_all_chat_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "allow_users_read_public_rooms" ON public.chat_rooms;

-- ახალი პოლიტიკები chat_rooms-ისთვის
-- ყველა ავტორიზებული მომხმარებელი შეძლებს ჩატის შექმნას
CREATE POLICY "authenticated_users_can_create_rooms" 
  ON public.chat_rooms 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (created_by = auth.uid());

-- ადმინები შეძლებენ ყველა ჩატის ნახვას, რედაქტირებას და წაშლას
CREATE POLICY "admin_full_access_rooms" 
  ON public.chat_rooms 
  FOR ALL 
  TO authenticated 
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- ყველა ავტორიზებული მომხმარებელი შეძლებს საჯარო ჩატების ნახვას
CREATE POLICY "users_can_read_public_rooms" 
  ON public.chat_rooms 
  FOR SELECT 
  TO authenticated 
  USING (is_public = true);

-- ჩატის შემქმნელი შეძლებს საკუთარი ჩატის რედაქტირებას და წაშლას
CREATE POLICY "creators_can_manage_own_rooms" 
  ON public.chat_rooms 
  FOR UPDATE 
  TO authenticated 
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "creators_can_delete_own_rooms" 
  ON public.chat_rooms 
  FOR DELETE 
  TO authenticated 
  USING (created_by = auth.uid());

-- განვაახლოთ chat_participants პოლიტიკები
DROP POLICY IF EXISTS "allow_admin_all_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "allow_users_own_participation" ON public.chat_participants;
DROP POLICY IF EXISTS "allow_users_join_chats" ON public.chat_participants;

-- ახალი პოლიტიკები chat_participants-ისთვის
-- ადმინები შეძლებენ ყველაფერს
CREATE POLICY "admin_full_access_participants" 
  ON public.chat_participants 
  FOR ALL 
  TO authenticated 
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- ყველა ავტორიზებული მომხმარებელი შეძლებს საკუთარი მონაწილეობის ნახვას
CREATE POLICY "users_can_view_own_participation" 
  ON public.chat_participants 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

-- ყველა ავტორიზებული მომხმარებელი შეძლებს საჯარო ჩატებში შეერთებას
CREATE POLICY "users_can_join_public_chats" 
  ON public.chat_participants 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE id = room_id AND is_public = true
    )
  );

-- ჩატის შემქმნელი შეძლებს მონაწილეების დამატებას საკუთარ ჩატში
CREATE POLICY "room_creators_can_add_participants" 
  ON public.chat_participants 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE id = room_id AND created_by = auth.uid()
    )
  );

-- მონაწილეები შეძლებენ საკუთარი მონაწილეობის განახლებას (მაგ. last_read_at)
CREATE POLICY "participants_can_update_own_participation" 
  ON public.chat_participants 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- მონაწილეები შეძლებენ ჩატიდან გასვლას
CREATE POLICY "participants_can_leave_chats" 
  ON public.chat_participants 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- დავამატოთ created_by ველი chat_rooms ცხრილში თუ არ არსებობს
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_rooms' 
        AND column_name = 'created_by'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.chat_rooms 
        ADD COLUMN created_by uuid REFERENCES auth.users(id);
    END IF;
END $$;
