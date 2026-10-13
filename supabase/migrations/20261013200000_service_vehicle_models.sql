begin;
alter table public.mechanic_services add column if not exists vehicle_models jsonb not null default '[]'::jsonb;
create or replace function public.validate_service_vehicle_models() returns trigger
language plpgsql set search_path=public,pg_temp as $$
declare item jsonb; brand text; model text; slug text; cleaned jsonb := '[]'::jsonb; seen text[] := '{}';
begin
 if jsonb_typeof(new.vehicle_models) <> 'array' or jsonb_array_length(new.vehicle_models)>50 then
  raise check_violation using message='Choose at most 50 vehicle models';
 end if;
 for item in select value from jsonb_array_elements(new.vehicle_models) loop
  if jsonb_typeof(item->'brand') <> 'string' or jsonb_typeof(item->'model') <> 'string' or not(item ? 'brand' and item ? 'model') then
   raise check_violation using message='Model requires a brand and model name';
  end if;
  brand:=btrim(item->>'brand'); model:=regexp_replace(btrim(item->>'model'),'\s+',' ','g');
  if not(brand=any(coalesce(new.car_brands,'{}'::text[]))) then continue; end if;
  slug:=regexp_replace(lower(model),'[^a-z0-9]','','g');
  if length(model) not between 1 and 80 or length(slug) not between 1 and 64 then
   raise check_violation using message='Enter a model name using Latin letters and numbers';
  end if;
  if not((brand||':'||slug)=any(seen)) then
   cleaned:=cleaned||jsonb_build_array(jsonb_build_object('brand',brand,'model',model,'slug',slug));
   seen:=array_append(seen,brand||':'||slug);
  end if;
 end loop;
 new.vehicle_models:=cleaned;
 return new;
end $$;
drop trigger if exists validate_service_vehicle_models on public.mechanic_services;
create trigger validate_service_vehicle_models before insert or update of vehicle_models,car_brands
on public.mechanic_services for each row execute function public.validate_service_vehicle_models();
create index if not exists mechanic_services_vehicle_models_gin on public.mechanic_services using gin(vehicle_models);
commit;
