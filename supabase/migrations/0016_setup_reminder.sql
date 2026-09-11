-- Recovery for members who paid but never finished the profile step (task A8,
-- the "finish setting up your account" email). The signal for "paid but
-- unfinished" is subscription_status = 'active' with no display_name yet — the
-- profile step is where display_name gets set (see ProfileStep / profile.js).
--
-- This column dedupes the reminder: a straggler is emailed once, not on every
-- scheduled run. NULL = not yet reminded.
alter table public.profiles
  add column if not exists setup_reminder_sent_at timestamptz;

-- The target set for the scheduled reminder, resolved server-side so the edge
-- function gets ids + emails in one call (email lives in auth.users, which the
-- REST client can't join to). Grace window is measured from profiles.created_at
-- — the account is created at the login step, immediately before payment, so
-- "created over N minutes ago" is a close proxy for "paid a while ago and still
-- hasn't finished". Security definer + granted only to service_role, so only
-- the edge function (service key) can enumerate members this way.
create or replace function public.setup_reminder_targets(p_grace_minutes int default 60)
returns table (id uuid, email text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, u.email, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.subscription_status = 'active'
    and (p.display_name is null or p.display_name = '')
    and p.setup_reminder_sent_at is null
    and p.created_at < now() - make_interval(mins => p_grace_minutes)
  order by p.created_at asc
$$;

revoke all on function public.setup_reminder_targets(int) from public, anon, authenticated;
grant execute on function public.setup_reminder_targets(int) to service_role;
