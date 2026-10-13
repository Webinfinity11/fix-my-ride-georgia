-- Preserve public content and all layouts; narrow unauthorized writes only.
begin;

alter function public.get_community_feed(text,text,integer,integer) set search_path = public, pg_temp;
alter function public.get_reaction_counts(uuid) set search_path = public, pg_temp;

-- Storage ownership is set by the Storage API from the uploader's JWT.
-- Keep public reads and existing URLs unchanged. Ownerless legacy service files
-- retain access through the existing UID folder, or an administrator.
alter policy "Users can upload chat files to own folder" on storage.objects
  to authenticated with check (bucket_id='chat-files' and coalesce(owner_id,owner::text)=(select auth.uid())::text);
alter policy "Users can update their own chat files" on storage.objects
  to authenticated using (bucket_id='chat-files' and coalesce(owner_id,owner::text)=(select auth.uid())::text)
  with check (bucket_id='chat-files' and coalesce(owner_id,owner::text)=(select auth.uid())::text);
alter policy "Users can delete their own chat files" on storage.objects
  to authenticated using (bucket_id='chat-files' and (coalesce(owner_id,owner::text)=(select auth.uid())::text or public.is_admin((select auth.uid()))));

alter policy "Users can upload community media to own folder" on storage.objects
  to authenticated with check (bucket_id='community-media' and (storage.foldername(name))[1]=(select auth.uid())::text and coalesce(owner_id,owner::text)=(select auth.uid())::text);

-- These folders already use the signed-in user's UID. Admin DriveForm uses a
-- shared 'drives' folder, so preserve that explicitly authorized admin workflow.
alter policy "Users can upload service photos to own folder" on storage.objects
  to authenticated with check (bucket_id='service-photos' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin((select auth.uid()))) and (coalesce(owner_id,owner::text)=(select auth.uid())::text or public.is_admin((select auth.uid()))));
alter policy "Users can upload service videos to own folder" on storage.objects
  to authenticated with check (bucket_id='service-videos' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin((select auth.uid()))) and (coalesce(owner_id,owner::text)=(select auth.uid())::text or public.is_admin((select auth.uid()))));

-- Contact submissions retain their form, but cannot impersonate another user.
-- Existing admin policies still allow administrative handling of messages.
-- Apply a restrictive guard so another permissive policy cannot bypass it.
drop policy if exists "Contact sender identity guard" on public.contact_messages;
create policy "Contact sender identity guard" on public.contact_messages as restrictive
  for insert to authenticated with check (user_id is null or user_id=(select auth.uid()) or public.is_admin((select auth.uid())));

-- Keep the existing browser search tracker working, but make its writes a
-- narrowly defined event: one increment, with timestamps supplied by the DB.
create or replace function public.guard_search_query_event() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if current_user not in ('anon','authenticated') or public.is_admin((select auth.uid())) then return new; end if;
  if tg_op='INSERT' then
    new.query := lower(btrim(new.query));
    new.search_count := 1;
    new.first_searched_at := now(); new.last_searched_at := now();
    new.created_at := now(); new.updated_at := now();
  else
    if new.id is distinct from old.id or new.query is distinct from old.query
       or new.first_searched_at is distinct from old.first_searched_at
       or new.created_at is distinct from old.created_at then
      raise insufficient_privilege using message='Search events cannot rewrite query records';
    end if;
    new.search_count := least(coalesce(old.search_count,0)::bigint+1,2147483647)::integer;
    new.last_searched_at := now(); new.updated_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists a_guard_search_query_event on public.search_queries;
create trigger a_guard_search_query_event before insert or update on public.search_queries
  for each row execute function public.guard_search_query_event();
alter policy "Anyone can insert search queries" on public.search_queries
  to anon,authenticated with check (length(btrim(query)) between 1 and 200 and search_count=1);
alter policy "Anyone can update search queries" on public.search_queries
  to anon,authenticated using (length(btrim(query)) between 1 and 200)
  with check (length(btrim(query)) between 1 and 200 and search_count>=1);
commit;
