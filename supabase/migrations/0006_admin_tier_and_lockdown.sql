-- Adds 'admin' as a fourth tier value on the same profiles.tier column
-- (rather than a separate role table), per explicit product decision.
--
-- Widening the CHECK to allow 'admin' opens a privilege-escalation hole:
-- the existing "users can update their own profile" policy (0004) has no
-- column-level restriction, so any authenticated user could otherwise set
-- their own tier to 'admin' via a plain client .update() call. RLS can't
-- compare OLD vs NEW column values in one USING/WITH CHECK expression, so
-- this is enforced with a trigger instead. auth.uid() is only non-null for
-- writes that go through PostgREST with a user JWT — direct SQL run in the
-- Supabase SQL Editor (or a service-role client) sees auth.uid() as null,
-- which is the deliberate escape hatch for manually promoting an admin.
alter table public.profiles drop constraint if exists profiles_tier_check;
alter table public.profiles add constraint profiles_tier_check
  check (tier in ('disciple', 'leader', 'pastor', 'admin'));

create or replace function public.enforce_tier_immutability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' and new.tier = 'admin' then
    raise exception 'admin tier cannot be set through signup';
  end if;

  if tg_op = 'UPDATE' and new.tier is distinct from old.tier then
    raise exception 'tier cannot be changed via the client API; contact an administrator';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_enforce_tier_immutability on public.profiles;
create trigger profiles_enforce_tier_immutability
  before insert or update on public.profiles
  for each row execute function public.enforce_tier_immutability();
