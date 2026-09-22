-- New access model (replaces the tier-matched model from 0013/0015/0017/0018):
-- an active membership now unlocks EVERY course, full stop -- no per-course
-- tier match. Without a membership, a completed standalone purchase of that
-- specific course still unlocks it; otherwise the course stays price-gated.
--
-- courses.visible_tiers is DELIBERATELY left in place, untouched, with all
-- existing data intact -- per explicit decision, it becomes a display-only
-- targeting tag (the admin toggle and the admin course-list role filter
-- keep working exactly as they do today) and simply stops being read by
-- the functions/policies below. Nothing here drops a column or any data.
--
-- access_mode / sequential episode-unlocking (0021, 0027) is untouched: it
-- was already a separate check that only ever runs after course access is
-- granted, never influenced by visible_tiers, so it isn't affected by this
-- change either way.

create or replace function public.get_course_video_url(p_course_id uuid)
returns text
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_video_url text;
  v_allowed boolean;
begin
  select public.is_caller_admin() or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.subscription_status = 'active'
  ) or exists (
    select 1 from public.course_purchases
    where user_id = auth.uid() and course_id = p_course_id and status = 'completed'
  ) into v_allowed;

  if not v_allowed then
    return null;
  end if;

  select video_url into v_video_url from public.courses where id = p_course_id;
  return v_video_url;
end;
$$;

create or replace function public.get_lesson_video_url(p_lesson_id uuid)
returns text
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_course_id uuid;
  v_release_at timestamptz;
  v_is_open_access boolean;
  v_video_url text;
  v_is_admin boolean;
  v_allowed boolean;
  v_access_mode text;
  v_prev_lesson_id uuid;
  v_prev_completed boolean;
begin
  select course_id, release_at, is_open_access
  into v_course_id, v_release_at, v_is_open_access
  from public.course_lessons where id = p_lesson_id;
  if v_course_id is null then
    return null;
  end if;

  v_is_admin := public.is_caller_admin();

  -- Drip gate: non-admins can't fetch the video before its release date.
  if not v_is_admin and v_release_at is not null and v_release_at > now() then
    return null;
  end if;

  select v_is_admin or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.subscription_status = 'active'
  ) or exists (
    select 1 from public.course_purchases
    where user_id = auth.uid() and course_id = v_course_id and status = 'completed'
  ) into v_allowed;

  if not v_allowed then
    return null;
  end if;

  -- Sequential-access gate (0027) -- unchanged, still only considered once
  -- course access above has already been granted.
  if not v_is_admin and not v_is_open_access then
    select access_mode into v_access_mode from public.courses where id = v_course_id;

    if v_access_mode = 'sequential' then
      select ordered.prev_id into v_prev_lesson_id
      from (
        select id,
               lag(id) over (
                 order by week_number nulls last, position asc, created_at asc
               ) as prev_id
        from public.course_lessons
        where course_id = v_course_id
      ) ordered
      where ordered.id = p_lesson_id;

      if v_prev_lesson_id is not null then
        select completed into v_prev_completed
        from public.lesson_progress
        where user_id = auth.uid() and lesson_id = v_prev_lesson_id;

        if not coalesce(v_prev_completed, false) then
          return null;
        end if;
      end if;
    end if;
  end if;

  select video_url into v_video_url from public.course_lessons where id = p_lesson_id;
  return v_video_url;
end;
$$;

-- Course-linked resources (0018) mirror course access -- same rule change,
-- same reasoning: an active membership should unlock a course's attached
-- resources exactly like it unlocks the course's videos. General
-- (non-course) resources keep their own tier gate untouched -- that's a
-- separate feature not covered by this change.
drop policy if exists "members can view resources for accessible courses" on public.resources;
create policy "members can view resources for accessible courses"
  on public.resources for select to authenticated
  using (
    course_id is not null and (
      is_caller_admin()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.subscription_status = 'active')
      or exists (
        select 1 from public.course_purchases
        where course_purchases.user_id = auth.uid()
          and course_purchases.course_id = resources.course_id
          and course_purchases.status = 'completed'
      )
    )
  );

drop policy if exists "members can download resource files" on storage.objects;
create policy "members can download resource files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'resource-files' and exists (
      select 1 from public.resources r join public.profiles p on p.id = auth.uid()
      where r.file_path = objects.name and (
        (r.course_id is null and (p.tier = 'admin' or p.tier = any(r.visible_tiers)))
        or (r.course_id is not null and (
          p.tier = 'admin'
          or exists (select 1 from public.courses c where c.id = r.course_id and p.subscription_status = 'active')
          or exists (
            select 1 from public.course_purchases cp
            where cp.user_id = p.id and cp.course_id = r.course_id and cp.status = 'completed'
          )
        ))
      )
    )
  );
