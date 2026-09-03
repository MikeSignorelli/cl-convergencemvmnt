-- Admin Members page needs three things the client can't do on its own:
--   1. See each member's email (lives on auth.users, which anon/authenticated
--      has no grants on at all — has to go through a security-definer RPC
--      owned by postgres, same pattern as is_username_available).
--   2. Change another member's tier — blocked outright by 0006's
--      enforce_tier_immutability trigger, which treats ANY client-JWT
--      write as a self-escalation attempt regardless of who's asking.
--   3. Delete a member's account entirely (auth + profile), which needs
--      auth.users access the client role doesn't have either.
--
-- All three re-check the caller is an admin themselves before doing
-- anything — this is the only thing standing between "any signed-in user"
-- and "can rewrite anyone's tier or delete anyone's account", so it can't
-- be skipped just because the function is security definer.

create or replace function public.is_caller_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and tier = 'admin'
  );
$$;

-- Lets an admin change tiers through the app instead of only via the direct-
-- SQL escape hatch. auth.uid() is non-null for this call (it runs through
-- PostgREST with the admin's own JWT even though the function is security
-- definer — that setting isn't tied to execution role), so without this the
-- 0006 trigger would block it exactly like a self-escalation attempt. Only
-- an already-admin caller gets the bypass; everyone else hits the original
-- immutability check unchanged.
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

  if exists (select 1 from public.profiles where id = auth.uid() and tier = 'admin') then
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

create or replace function public.admin_list_members()
returns table (
  id uuid,
  email text,
  username text,
  display_name text,
  city text,
  tier text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, u.email, p.username, p.display_name, p.city, p.tier, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_caller_admin()
  order by p.created_at desc;
$$;

create or replace function public.admin_update_member(
  p_member_id uuid,
  p_tier text,
  p_display_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_caller_admin() then
    raise exception 'not authorized';
  end if;
  if p_tier not in ('disciple', 'leader', 'pastor', 'admin') then
    raise exception 'invalid tier';
  end if;

  update public.profiles
  set tier = p_tier, display_name = p_display_name
  where id = p_member_id;
end;
$$;

-- Deletes the real auth account, not just the profile row — profiles.id has
-- an `on delete cascade` FK to auth.users(id) (see 0001), so this takes the
-- profile with it in one statement rather than needing the Auth admin API.
create or replace function public.admin_delete_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_caller_admin() then
    raise exception 'not authorized';
  end if;
  if p_member_id = auth.uid() then
    raise exception 'cannot delete your own account';
  end if;

  delete from auth.users where id = p_member_id;
end;
$$;

grant execute on function public.is_caller_admin() to authenticated;
grant execute on function public.admin_list_members() to authenticated;
grant execute on function public.admin_update_member(uuid, text, text) to authenticated;
grant execute on function public.admin_delete_member(uuid) to authenticated;
