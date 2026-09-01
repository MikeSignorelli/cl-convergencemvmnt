-- Lets an anonymous visitor (pre-auth, at the "Create your login" step) check
-- username availability without being able to SELECT from pending_onboarding
-- directly (which is intentionally locked down to protect stashed emails).
create or replace function public.is_username_available(check_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (select 1 from public.profiles where username = check_username)
     and not exists (select 1 from public.pending_onboarding where username = check_username);
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;
