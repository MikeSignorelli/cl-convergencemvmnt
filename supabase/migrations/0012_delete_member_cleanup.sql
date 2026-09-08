-- admin_delete_member correctly removes auth.users (cascading away the
-- profiles row), but never touched pending_onboarding -- a separate table,
-- keyed by email rather than user id, that stashes the username+answers a
-- person picked during the email/password signup step until they finish it.
-- If an admin deleted someone who'd started but not finished that flow, the
-- stashed row lived on forever, permanently reserving their username (
-- is_username_available checks pending_onboarding by username, with no
-- awareness that the account behind it no longer exists) and blocking them
-- from reusing it on a fresh signup attempt.
create or replace function public.admin_delete_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  if not public.is_caller_admin() then
    raise exception 'not authorized';
  end if;
  if p_member_id = auth.uid() then
    raise exception 'cannot delete your own account';
  end if;

  select email into v_email from auth.users where id = p_member_id;

  delete from auth.users where id = p_member_id;

  if v_email is not null then
    delete from public.pending_onboarding where email = v_email;
  end if;
end;
$$;
