-- Validate the caller's fields before the existing expiry trigger transforms
-- them. Editing an expired service must still allow automatic deactivation.
begin;
drop trigger if exists guard_paid_placement on public.mechanic_services;
create trigger a_guard_paid_placement before insert or update on public.mechanic_services
  for each row execute function public.guard_privileged_listing_fields();
commit;
