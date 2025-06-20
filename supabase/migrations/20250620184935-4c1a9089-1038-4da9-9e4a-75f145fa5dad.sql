
-- Remove all existing policies that might cause recursion
DROP POLICY IF EXISTS "authenticated_users_can_create_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "admin_full_access_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "users_can_read_public_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "creators_can_manage_own_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "creators_can_delete_own_rooms" ON public.chat_rooms;

DROP POLICY IF EXISTS "admin_full_access_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "users_can_view_own_participation" ON public.chat_participants;
DROP POLICY IF EXISTS "users_can_join_public_chats" ON public.chat_participants;
DROP POLICY IF EXISTS "room_creators_can_add_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "participants_can_update_own_participation" ON public.chat_participants;
DROP POLICY IF EXISTS "participants_can_leave_chats" ON public.chat_participants;

-- Temporarily disable RLS to clear any remaining policies
ALTER TABLE public.chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants DISABLE ROW LEVEL SECURITY;

-- Drop any remaining policies
DROP POLICY IF EXISTS "chat_participants_select_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_insert_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_update_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_delete_policy" ON public.chat_participants;

-- Create simple, non-recursive policies for chat_rooms
CREATE POLICY "all_authenticated_can_create_rooms" 
  ON public.chat_rooms 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "admins_can_manage_all_rooms" 
  ON public.chat_rooms 
  FOR ALL 
  TO authenticated 
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "users_can_read_public_rooms" 
  ON public.chat_rooms 
  FOR SELECT 
  TO authenticated 
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "creators_can_update_own_rooms" 
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

-- Create simple, non-recursive policies for chat_participants
CREATE POLICY "admins_can_manage_all_participants" 
  ON public.chat_participants 
  FOR ALL 
  TO authenticated 
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "users_can_view_own_participation" 
  ON public.chat_participants 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "users_can_join_any_room" 
  ON public.chat_participants 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_update_own_participation" 
  ON public.chat_participants 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_leave_rooms" 
  ON public.chat_participants 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Re-enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
