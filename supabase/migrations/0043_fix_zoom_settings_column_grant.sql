-- Fixes "permission denied for table zoom_settings" when an admin saves
-- Zoom credentials via the client-side upsert (Settings -> Zoom). That
-- upsert is an INSERT ... ON CONFLICT (provider) DO UPDATE, which needs
-- SELECT access on every column it reads/writes to resolve the conflict --
-- including account_id/client_id. Migration 0036 only granted SELECT on
-- (provider, updated_by, updated_at), omitting account_id/client_id, so
-- even a real admin (correctly authorized by RLS) hit a hard permission
-- error before RLS was ever evaluated. payment_settings' equivalent fix
-- (0031) didn't have this gap because it included publishable_key -- its
-- own non-secret half -- in the granted column list; this brings
-- zoom_settings in line with that same pattern. client_secret still never
-- gets a grant, and the existing "admins manage zoom settings" RLS policy
-- still fully blocks every non-admin from seeing any row regardless of
-- this column grant.
revoke select on public.zoom_settings from anon, authenticated;
grant select (provider, account_id, client_id, updated_by, updated_at)
  on public.zoom_settings to anon, authenticated;
