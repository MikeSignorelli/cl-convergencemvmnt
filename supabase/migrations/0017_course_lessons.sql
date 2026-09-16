-- Courses become containers for multiple lesson-videos ("episodes"). Each
-- course_lessons row holds one external (Vimeo) video plus its own thumbnail,
-- description, further-info, order, and an optional fixed release_at date.
--
-- A lesson's video unlocks when BOTH hold:
--   1) course access — same rule as get_course_video_url (migration 0015):
--      admin, OR active member whose tier is in the course's visible_tiers,
--      OR a completed standalone purchase of that course; and
--   2) the drip gate — release_at is null (available now) or already passed.
-- Admins bypass the drip gate so they can preview unreleased episodes.

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  extra_info text,
  video_url text not null,
  thumbnail_path text,
  duration_label text,
  release_at timestamptz,
  position integer not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Additive columns, in case an earlier partial run created the table without them.
alter table public.course_lessons add column if not exists extra_info text;
alter table public.course_lessons add column if not exists thumbnail_path text;
alter table public.course_lessons add column if not exists release_at timestamptz;

create index if not exists course_lessons_course_position_idx
  on public.course_lessons (course_id, position);

alter table public.course_lessons enable row level security;

grant select on public.course_lessons to anon, authenticated;
grant insert, update, delete on public.course_lessons to authenticated;
revoke select (video_url) on public.course_lessons from anon, authenticated;

drop policy if exists "anyone can browse course lessons" on public.course_lessons;
create policy "anyone can browse course lessons"
  on public.course_lessons for select to anon, authenticated
  using (true);

drop policy if exists "admins manage course lessons" on public.course_lessons;
create policy "admins manage course lessons"
  on public.course_lessons for all to authenticated
  using (public.is_caller_admin())
  with check (public.is_caller_admin());

-- Gated + drip-aware video URL for one lesson.
create or replace function public.get_lesson_video_url(p_lesson_id uuid)
returns text
language plpgsql
security definer
set search_path = public
stable
as $fn$
declare
  v_course_id uuid;
  v_release_at timestamptz;
  v_video_url text;
  v_is_admin boolean;
  v_allowed boolean;
begin
  select course_id, release_at into v_course_id, v_release_at
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
    join public.courses c on c.id = v_course_id
    where p.id = auth.uid()
      and p.subscription_status = 'active'
      and p.tier = any(c.visible_tiers)
  ) or exists (
    select 1 from public.course_purchases
    where user_id = auth.uid() and course_id = v_course_id and status = 'completed'
  ) into v_allowed;

  if not v_allowed then
    return null;
  end if;

  select video_url into v_video_url from public.course_lessons where id = p_lesson_id;
  return v_video_url;
end;
$fn$;

grant execute on function public.get_lesson_video_url(uuid) to authenticated;

-- Admin lesson list WITH video_url + all fields (the column is revoked from
-- direct client SELECT above) — mirrors admin_list_courses.
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
  "position" integer,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $fn$
  select l.id, l.course_id, l.title, l.description, l.extra_info, l.video_url,
         l.thumbnail_path, l.duration_label, l.release_at, l.position, l.created_at
  from public.course_lessons l
  where public.is_caller_admin() and l.course_id = p_course_id
  order by l.position asc, l.created_at asc;
$fn$;

grant execute on function public.admin_list_lessons(uuid) to authenticated;

-- Backfill: each existing course's single video becomes its first lesson.
insert into public.course_lessons (course_id, title, video_url, position, created_by)
select c.id, 'Lesson 1', c.video_url, 0, c.created_by
from public.courses c
where c.video_url is not null and c.video_url <> ''
  and not exists (select 1 from public.course_lessons l where l.course_id = c.id);

-- Courses can now be pure containers (videos live in course_lessons).
alter table public.courses alter column video_url drop not null;
