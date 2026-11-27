-- VIP price list with a time-limited promotion, and requests from the public /vip page.
begin;

create table if not exists public.vip_pricing (
  id boolean primary key default true check (id),
  vip_price integer not null default 30 check (vip_price > 0),
  super_vip_price integer not null default 50 check (super_vip_price > 0),
  vip_discount_percent integer not null default 50 check (vip_discount_percent between 0 and 90),
  super_vip_discount_percent integer not null default 60 check (super_vip_discount_percent between 0 and 90),
  duration_days integer not null default 30 check (duration_days > 0),
  promo_ends_at timestamptz
);
insert into public.vip_pricing (id) values (true) on conflict (id) do nothing;

alter table public.vip_pricing enable row level security;
drop policy if exists "anyone reads vip pricing" on public.vip_pricing;
create policy "anyone reads vip pricing" on public.vip_pricing for select to anon, authenticated using (true);
drop policy if exists "admins change vip pricing" on public.vip_pricing;
create policy "admins change vip pricing" on public.vip_pricing for update to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
revoke all on public.vip_pricing from anon, authenticated;
grant select on public.vip_pricing to anon, authenticated;
grant update on public.vip_pricing to authenticated;

create table if not exists public.vip_leads (
  id bigint generated always as identity primary key,
  plan text not null check (plan in ('vip', 'super_vip')),
  phone text not null check (phone ~ '^5[0-9]{8}$'),
  email text,
  service_id integer references public.mechanic_services(id) on delete set null,
  mechanic_id uuid,
  price_gel integer not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'paid', 'activated', 'rejected')),
  created_at timestamptz not null default now()
);
create index if not exists vip_leads_created_idx on public.vip_leads (created_at desc);

-- Visitors cannot read or write the table; they can only call submit_vip_lead.
alter table public.vip_leads enable row level security;
drop policy if exists "admins read vip leads" on public.vip_leads;
create policy "admins read vip leads" on public.vip_leads for select to authenticated
  using (public.is_admin(auth.uid()));
drop policy if exists "admins update vip leads" on public.vip_leads;
create policy "admins update vip leads" on public.vip_leads for update to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
revoke all on public.vip_leads from anon, authenticated;
grant select, update on public.vip_leads to authenticated;

-- The price is decided here, never by the browser.
create or replace function public.submit_vip_lead(
  p_plan text, p_phone text, p_email text default null, p_service_id integer default null
) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_phone text := regexp_replace(
    regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), '^(995|0)(5[0-9]{8})$', '\2');
  v_email text := nullif(btrim(coalesce(p_email, '')), '');
  v_mechanic uuid;
  v_price integer;
begin
  if p_plan is null or p_plan not in ('vip', 'super_vip') then raise exception 'invalid_plan'; end if;
  if v_phone !~ '^5[0-9]{8}$' then raise exception 'invalid_phone'; end if;
  if v_email is not null and (length(v_email) > 200 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'invalid_email';
  end if;
  if p_service_id is not null then
    select mechanic_id into v_mechanic from mechanic_services where id = p_service_id and is_active;
    if not found then raise exception 'invalid_service'; end if;
  end if;

  select round((case when p_plan = 'vip' then vip_price else super_vip_price end)
      * (case when promo_ends_at > now()
          then 100 - (case when p_plan = 'vip' then vip_discount_percent else super_vip_discount_percent end)
          else 100 end) / 100.0)::integer
    into v_price from vip_pricing;

  -- Pressing the button twice must not create two requests.
  if exists (select 1 from vip_leads where phone = v_phone and plan = p_plan
      and service_id is not distinct from p_service_id and status = 'new'
      and created_at > now() - interval '1 day') then
    return v_price;
  end if;
  -- Spam limits: per number per day, and for the whole site per hour.
  if (select count(*) from vip_leads where phone = v_phone and created_at > now() - interval '1 day') >= 5
     or (select count(*) from vip_leads where created_at > now() - interval '1 hour') >= 60 then
    raise exception 'too_many_requests';
  end if;

  insert into vip_leads (plan, phone, email, service_id, mechanic_id, price_gel)
    values (p_plan, v_phone, v_email, p_service_id, v_mechanic, v_price);
  return v_price;
end;
$$;
revoke all on function public.submit_vip_lead(text, text, text, integer) from public;
grant execute on function public.submit_vip_lead(text, text, text, integer) to anon, authenticated;

commit;
