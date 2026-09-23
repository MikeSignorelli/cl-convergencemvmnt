-- Fixes the deeper version of the "permission denied for table
-- zoom_settings" bug: even after granting SELECT on account_id/client_id
-- (0043), saving actually fails again the moment a real client_secret is
-- included in the payload, because INSERT ... ON CONFLICT DO UPDATE needs
-- SELECT access on every column it references (including via excluded.*)
-- to resolve the conflict -- and client_secret can never be granted
-- SELECT without defeating the entire point of hiding it from the client.
-- payment_settings.secret_key has the identical latent bug (it just hasn't
-- surfaced yet, since updating publishable_key without re-pasting the
-- secret happens to avoid it).
--
-- The correct fix: move the WRITE into a security-definer function too,
-- mirroring the existing pattern already used for the READ side
-- (get_zoom_settings / get_stripe_settings). Running as the function
-- owner sidesteps the calling role's grants entirely, so client_secret /
-- secret_key never need a SELECT grant at all. is_caller_admin() is
-- checked inside the function body instead of via table RLS for this
-- specific write path. updated_by is derived from auth.uid() server-side
-- now (rather than trusted from the client) since RLS's own `with check`
-- no longer runs against this write path.

create or replace function public.save_zoom_settings(
  p_account_id text,
  p_client_id text,
  p_client_secret text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_caller_admin() then
    raise exception 'Admin access required';
  end if;

  insert into public.zoom_settings (provider, account_id, client_id, client_secret, updated_by, updated_at)
  values ('zoom', p_account_id, p_client_id, p_client_secret, auth.uid(), now())
  on conflict (provider) do update set
    account_id = excluded.account_id,
    client_id = excluded.client_id,
    -- A blank/omitted secret keeps whatever's already stored -- there's no
    -- way to read the current one back to confirm it first anyway.
    client_secret = coalesce(excluded.client_secret, public.zoom_settings.client_secret),
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;
end;
$$;

grant execute on function public.save_zoom_settings(text, text, text) to authenticated;

create or replace function public.save_stripe_settings(
  p_publishable_key text,
  p_secret_key text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_caller_admin() then
    raise exception 'Admin access required';
  end if;

  insert into public.payment_settings (provider, publishable_key, secret_key, updated_by, updated_at)
  values ('stripe', p_publishable_key, p_secret_key, auth.uid(), now())
  on conflict (provider) do update set
    publishable_key = excluded.publishable_key,
    secret_key = coalesce(excluded.secret_key, public.payment_settings.secret_key),
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;
end;
$$;

grant execute on function public.save_stripe_settings(text, text) to authenticated;
