-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view chat participants in their rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Admins can view all chat_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view their own chat_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "users_can_view_own_participation" ON public.chat_participants;
DROP POLICY IF EXISTS "Authenticated users can manage chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can create chat_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can join public chat rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "admins_can_manage_all_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "users_can_join_any_room" ON public.chat_participants;
DROP POLICY IF EXISTS "users_can_leave_rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "users_can_update_own_participation" ON public.chat_participants;

-- Also clean up problematic chat_rooms policies
DROP POLICY IF EXISTS "Users can view public chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_select_policy" ON public.chat_rooms;
DROP POLICY IF EXISTS "users_can_read_public_rooms" ON public.chat_rooms;

-- Create simple, non-recursive policies for chat_participants
CREATE POLICY "chat_participants_select" ON public.chat_participants
  FOR SELECT USING (
    user_id = auth.uid() OR is_current_user_admin()
  );

CREATE POLICY "chat_participants_insert" ON public.chat_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR is_current_user_admin()
  );

CREATE POLICY "chat_participants_update" ON public.chat_participants
  FOR UPDATE USING (
    user_id = auth.uid() OR is_current_user_admin()
  );

CREATE POLICY "chat_participants_delete" ON public.chat_participants
  FOR DELETE USING (
    user_id = auth.uid() OR is_current_user_admin()
  );

-- Create simple policies for chat_rooms
CREATE POLICY "chat_rooms_select" ON public.chat_rooms
  FOR SELECT USING (
    is_public = true OR created_by = auth.uid() OR is_current_user_admin()
  );

CREATE POLICY "chat_rooms_insert" ON public.chat_rooms
  FOR INSERT WITH CHECK (
    created_by = auth.uid() OR is_current_user_admin()
  );

CREATE POLICY "chat_rooms_update" ON public.chat_rooms
  FOR UPDATE USING (
    created_by = auth.uid() OR is_current_user_admin()
  );

CREATE POLICY "chat_rooms_delete" ON public.chat_rooms
  FOR DELETE USING (
    created_by = auth.uid() OR is_current_user_admin()
  );