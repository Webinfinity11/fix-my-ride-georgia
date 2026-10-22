begin;
-- Paid placement is controlled by administrators or trusted server jobs only.
create or replace function public.update_service_vip_status(
  p_service_id integer, p_vip_status public.vip_plan_type,
  p_vip_until timestamptz, p_is_vip_active boolean
) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and not coalesce(public.is_admin(auth.uid()), false) then
    raise insufficient_privilege using message = 'Administrator access required';
  end if;
  update public.mechanic_services set vip_status=p_vip_status, vip_until=p_vip_until,
    is_vip_active=p_is_vip_active, updated_at=now() where id=p_service_id;
end;
$$;
revoke all on function public.update_service_vip_status(integer,public.vip_plan_type,timestamptz,boolean) from public,anon;
grant execute on function public.update_service_vip_status(integer,public.vip_plan_type,timestamptz,boolean) to authenticated,service_role;

-- Row ownership alone must not allow an owner to promote their own service or
-- pin their own post through the REST API. Keep trusted expiry jobs working.
create or replace function public.guard_privileged_listing_fields() returns trigger
language plpgsql set search_path=public,pg_temp as $$
begin
  if current_user not in ('anon','authenticated') or coalesce(public.is_admin(auth.uid()),false) then return new; end if;
  if tg_table_name='mechanic_services' then
    if tg_op='INSERT' then
      if new.vip_status is not null or new.vip_until is not null or coalesce(new.is_vip_active,false) then
        raise insufficient_privilege using message='Paid placement requires administrator approval';
      end if;
    elsif new.vip_status is distinct from old.vip_status or new.vip_until is distinct from old.vip_until or new.is_vip_active is distinct from old.is_vip_active then
      raise insufficient_privilege using message='Paid placement requires administrator approval';
    end if;
  else
    if tg_op='INSERT' then
      if coalesce(new.is_pinned,false) or new.pinned_by is not null or new.pinned_at is not null then
        raise insufficient_privilege using message='Only administrators can pin posts';
      end if;
    elsif new.is_pinned is distinct from old.is_pinned or new.pinned_by is distinct from old.pinned_by or new.pinned_at is distinct from old.pinned_at then
      raise insufficient_privilege using message='Only administrators can pin posts';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists guard_paid_placement on public.mechanic_services;
create trigger guard_paid_placement before insert or update on public.mechanic_services for each row execute function public.guard_privileged_listing_fields();
drop trigger if exists guard_post_pinning on public.posts;
create trigger guard_post_pinning before insert or update on public.posts for each row execute function public.guard_privileged_listing_fields();
-- Raw searches can contain personal information. Public clients may append an
-- event, but cannot retrieve the global history or choose aggregate counts.
create policy "Search history privacy" on public.search_queries as restrictive
  for select to anon,authenticated using (public.is_admin(auth.uid()));
create policy "Search history write guard" on public.search_queries as restrictive
  for insert to anon,authenticated with check (public.is_admin(auth.uid()));
create policy "Search history update guard" on public.search_queries as restrictive
  for update to anon,authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create or replace function public.record_search_query(p_query text) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare clean_query text := lower(btrim(p_query));
begin
  if clean_query is null or length(clean_query) not between 1 and 200 then return; end if;
  insert into public.search_queries(query,search_count,first_searched_at,last_searched_at)
    values(clean_query,1,now(),now())
  on conflict(query) do update set
    search_count=least(coalesce(search_queries.search_count,0)::bigint+1,2147483647)::integer,
    last_searched_at=now();
end;
$$;
revoke all on function public.record_search_query(text) from public;
grant execute on function public.record_search_query(text) to anon,authenticated;

-- Professional records are public only for actual mechanic accounts.
alter policy "Anyone can view mechanic profiles" on public.mechanic_profiles
  using (id=auth.uid() or public.is_admin(auth.uid()) or exists (
    select 1 from public.profiles p where p.id=mechanic_profiles.id and p.role='mechanic'
  ));
-- Certificates may include personal identifiers: require explicit publication.
alter table public.certificates add column if not exists is_public boolean not null default false;
alter policy "Certificates are viewable by everyone" on public.certificates
  using (mechanic_id=auth.uid() or public.is_admin(auth.uid()) or (is_public and exists (
    select 1 from public.profiles p where p.id=certificates.mechanic_id and p.role='mechanic'
  )));
-- Driving venues are admin-curated business listings, not private profiles.
-- Keep existing listings published; future drafts can be hidden by admins.
alter table public.drives add column if not exists is_published boolean not null default true;
alter policy "Anyone can view drives" on public.drives
  using (is_published or public.is_admin(auth.uid()));
commit;
