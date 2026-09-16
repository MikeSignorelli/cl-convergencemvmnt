-- Backing table for the new course-health-check Edge Function
-- (supabase/functions/course-health-check), the platform's second scheduled
-- job after send-setup-reminders (0016). Each run recomputes three kinds of
-- issue for course_lessons rows:
--   missing_video       -- vimeo_id is null (an unparseable/absent Vimeo
--                          link -- see course_lessons.vimeo_id, backfilled in
--                          0021) and the episode is already live or has no
--                          scheduled release at all, i.e. it should already
--                          have a working video and doesn't.
--   upcoming_no_video   -- vimeo_id is null and release_at falls within the
--                          admin-configurable "days ahead" notice window --
--                          a heads-up before the drip date, not yet urgent.
--   broken_link         -- vimeo_id is set, but a Vimeo oEmbed check no
--                          longer resolves it (the video was deleted or made
--                          private after being linked).
--
-- Deliberately NOT a persistent history table: the function deletes every
-- currently-unresolved row and reinserts a fresh unresolved set on each run
-- (see the function's own comment), since these are point-in-time findings
-- recomputed from scratch, not events worth keeping forever. resolved_at
-- stays nullable/unused by the function itself -- it's there so a future
-- admin "dismiss" action has somewhere to record that without deleting the
-- row outright, and so the delete-and-reinsert step (which only ever
-- targets resolved_at IS NULL) leaves any such row untouched.
create table if not exists public.course_health_flags (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  flag_type text not null check (flag_type in ('missing_video', 'upcoming_no_video', 'broken_link')),
  detected_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists course_health_flags_unresolved_idx
  on public.course_health_flags (resolved_at)
  where resolved_at is null;

create index if not exists course_health_flags_course_idx
  on public.course_health_flags (course_id);

alter table public.course_health_flags enable row level security;

-- Admin-internal only -- unlike course_lessons/course_categories, nothing
-- here is ever shown to a member or the public, so there's no anon/general
-- "browse" grant at all.
grant select, insert, update, delete on public.course_health_flags to authenticated;
revoke all on public.course_health_flags from anon;

drop policy if exists "admins manage course health flags" on public.course_health_flags;
create policy "admins manage course health flags"
  on public.course_health_flags for all to authenticated
  using (public.is_caller_admin())
  with check (public.is_caller_admin());
