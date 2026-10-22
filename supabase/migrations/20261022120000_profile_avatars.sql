-- Profile photos: public reads; each authenticated user can only write their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Profile avatar public read" on storage.objects;
create policy "Profile avatar public read" on storage.objects for select
using (bucket_id = 'avatars');
drop policy if exists "Profile avatar owner insert" on storage.objects;
create policy "Profile avatar owner insert" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Existing environments may already have equivalent avatar policies. No broader
-- write access is granted: uploads remain confined to the owner's folder.
