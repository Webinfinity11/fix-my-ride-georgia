-- No rendered UI changes. Keep public catalogues readable.
begin;
create or replace function public.can_view_chat_presence(target_user uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select auth.uid() is not null and (
    target_user=auth.uid() or public.is_admin(auth.uid()) or exists (
      select 1 from public.chat_participants target
      join public.chat_rooms room on room.id=target.room_id
      where target.user_id=target_user and (
        room.created_by=auth.uid() or (room.type='channel' and room.is_public=true)
        or exists(select 1 from public.chat_participants viewer where viewer.room_id=room.id and viewer.user_id=auth.uid())
      )
    )
  );
$$;
revoke all on function public.can_view_chat_presence(uuid) from public;
grant execute on function public.can_view_chat_presence(uuid) to authenticated;

-- Replace unconditional SELECT policies, regardless of historical naming.
do $$ declare policy_row record;
begin
  for policy_row in select policyname,tablename from pg_policies
    where schemaname='public' and tablename in ('user_roles','user_presence')
      and cmd='SELECT' and qual in ('true','(true)')
  loop
    if policy_row.tablename='user_roles' then
      execute format('alter policy %I on public.user_roles to authenticated using (user_id=(select auth.uid()) or public.is_admin((select auth.uid())))',policy_row.policyname);
    else
      execute format('alter policy %I on public.user_presence to authenticated using (public.can_view_chat_presence(user_id))',policy_row.policyname);
    end if;
  end loop;
end $$;
-- Restrictive guards also prevent another permissive policy bypassing protection.
drop policy if exists "Private role read guard" on public.user_roles;
create policy "Private role read guard" on public.user_roles as restrictive
for select to public using (user_id=(select auth.uid()) or public.is_admin((select auth.uid())));
drop policy if exists "Chat presence read guard" on public.user_presence;
create policy "Chat presence read guard" on public.user_presence as restrictive
for select to authenticated using (public.can_view_chat_presence(user_id));
commit;
