-- Lets the signup form warn "this email is already registered with Google"
-- before sending a magic link, instead of silently emailing a sign-in link
-- for an account the person doesn't realize already exists. Deliberately
-- returns only existence + provider list (no name, no confirmation status,
-- no other PII) — enough for this one UX decision, nothing that meaningfully
-- worsens account-enumeration exposure beyond "an email is taken", which
-- is already implied by is_username_available's existence.
create or replace function public.check_email_signup_status(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_user_id uuid;
  v_providers text[];
begin
  select id into v_user_id from auth.users where lower(email) = lower(p_email) limit 1;
  if v_user_id is null then
    return jsonb_build_object('exists', false, 'providers', '[]'::jsonb);
  end if;

  select coalesce(array_agg(distinct provider), array[]::text[]) into v_providers
    from auth.identities where user_id = v_user_id;

  return jsonb_build_object('exists', true, 'providers', to_jsonb(v_providers));
end;
$$;

grant execute on function public.check_email_signup_status(text) to anon, authenticated;
