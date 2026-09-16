-- 0020_lesson_week.sql
-- Adds an explicit "week" label to episodes so a member who bought a program
-- can see, at a glance, which week each episode belongs to and when it lands
-- (e.g. "Week 3 · Identifying Root Beliefs · Unlocks Jan 20").
--
-- This is purely a DISPLAY label. What actually unlocks an episode is still
-- release_at (see get_lesson_video_url's drip gate) — week_number just names it.

alter table public.course_lessons
  add column if not exists week_number integer;

-- admin_list_lessons has to return the new column too. Changing a function's
-- return type needs a drop first (create-or-replace can't alter the signature).
drop function if exists public.admin_list_lessons(uuid);
create or replace function public.admin_list_lessons(p_course_id uuid)
returns table (
  id uuid,
  course_id uuid,
  title text,
  description text,
  extra_info text,
  video_url text,
  thumbnail_path text,
  duration_label text,
  release_at timestamptz,
  week_number integer,
  "position" integer,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $fn$
  select l.id, l.course_id, l.title, l.description, l.extra_info, l.video_url,
         l.thumbnail_path, l.duration_label, l.release_at, l.week_number, l.position, l.created_at
  from public.course_lessons l
  where public.is_caller_admin() and l.course_id = p_course_id
  order by l.position asc, l.created_at asc;
$fn$;

grant execute on function public.admin_list_lessons(uuid) to authenticated;
