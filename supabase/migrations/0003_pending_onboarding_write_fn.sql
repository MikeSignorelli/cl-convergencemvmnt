-- Anonymous "Create your login" submissions need to upsert a pending_onboarding
-- row, but Postgres RLS requires SELECT-visibility into any potentially-
-- conflicting row to even plan an `INSERT ... ON CONFLICT DO UPDATE` — which
-- directly conflicts with the SELECT policy that (intentionally) hides these
-- rows from anon entirely to protect prospects' emails. Routing the write
-- through a security-definer function sidesteps that: the function bypasses
-- RLS internally, while the raw table stays locked down for direct access.
create or replace function public.start_pending_onboarding(
  p_email text,
  p_username text,
  p_answers jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pending_onboarding (email, username, answers, updated_at)
  values (p_email, p_username, p_answers, now())
  on conflict (email) do update
    set username = excluded.username,
        answers = excluded.answers,
        updated_at = now();
end;
$$;

grant execute on function public.start_pending_onboarding(text, text, jsonb) to anon, authenticated;

-- No longer needed now that writes go through the function above — tighten
-- back down to select/delete only (both already scoped to the matching
-- authenticated user).
drop policy if exists "anyone can start or update a pending signup" on public.pending_onboarding;
drop policy if exists "anyone can update a pending signup" on public.pending_onboarding;
