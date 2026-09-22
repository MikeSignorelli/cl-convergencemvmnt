-- Zoom Server-to-Server OAuth credentials, mirroring payment_settings
-- (migration 0030) exactly: a write-only secret an admin pastes in Settings,
-- read only by Edge Functions via the service role, never returned raw to
-- any client. account_id/client_id are the "public half" of a
-- Server-to-Server OAuth app (Zoom retired token-based JWT apps in 2023);
-- client_secret is what must never leave the server.
create table if not exists public.zoom_settings (
  provider text primary key default 'zoom',
  account_id text,
  client_id text,
  client_secret text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

alter table public.zoom_settings enable row level security;

create policy "admins manage zoom settings"
  on public.zoom_settings for all to authenticated
  using (public.is_caller_admin())
  with check (public.is_caller_admin());

-- Same whole-table-revoke + explicit column allowlist pattern as
-- payment_settings post-0031: a column-level revoke alone can't narrow
-- Supabase's default whole-table grant, so the table grant is revoked
-- outright and only account_id/updated_by/updated_at (never client_id or
-- client_secret) are re-granted. RLS above already blocks every non-admin
-- row regardless, but the account_id column stays admin-only here at the
-- grant layer too since credential material is Zoom-account-identifying.
revoke select on public.zoom_settings from anon, authenticated;
grant select (provider, updated_by, updated_at) on public.zoom_settings to anon, authenticated;

create or replace function public.get_zoom_settings()
returns table (account_id text, client_id text, has_client_secret boolean, client_secret_hint text)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_row record;
begin
  if not public.is_caller_admin() then
    return query select null::text, null::text, false, null::text;
    return;
  end if;

  select z.account_id, z.client_id, z.client_secret
  into v_row
  from public.zoom_settings z
  where z.provider = 'zoom';

  if not found then
    return query select null::text, null::text, false, null::text;
    return;
  end if;

  return query select
    v_row.account_id,
    v_row.client_id,
    (v_row.client_secret is not null and v_row.client_secret <> ''),
    case when v_row.client_secret is not null and length(v_row.client_secret) >= 4
      then '****' || right(v_row.client_secret, 4)
      else null end;
end;
$$;

-- Tracks the Zoom meeting behind a live session, so an admin deleting the
-- session can also clean up the meeting via the Zoom API instead of
-- leaving it scheduled on Zoom's side forever.
alter table public.live_sessions
  add column if not exists zoom_meeting_id text;
