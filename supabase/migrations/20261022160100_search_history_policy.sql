-- Make the original policy explicit as well as retaining the restrictive guard.
alter policy "Anyone can view search queries" on public.search_queries
  using (public.is_admin(auth.uid()));
