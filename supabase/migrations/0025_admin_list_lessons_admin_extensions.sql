-- 0025_admin_list_lessons_admin_extensions.sql
--
-- admin_list_lessons() (0017, last redefined for week_number in 0020)
-- predates the course_lessons Vimeo-metadata/open-access/audit columns added
-- in 0021 (vimeo_id, duration_seconds, duration_source, thumbnail_url,
-- is_open_access, created_by, updated_by). The admin Episodes panel
-- (EpisodesPanel.jsx) loads its episode list exclusively through this RPC,
-- so without these columns it has no way to show auto-fetched Vimeo
-- duration/thumbnail, the free-preview flag, or who created/last edited an
-- episode.
--
-- Purely additive: same columns and behavior as before, plus the 0021
-- lesson-level metadata columns.

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
  vimeo_id text,
  duration_seconds numeric,
  duration_source text,
  thumbnail_url text,
  is_open_access boolean,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $fn$
  select l.id, l.course_id, l.title, l.description, l.extra_info, l.video_url,
         l.thumbnail_path, l.duration_label, l.release_at, l.week_number, l.position,
         l.vimeo_id, l.duration_seconds, l.duration_source, l.thumbnail_url,
         l.is_open_access, l.created_by, l.updated_by, l.created_at
  from public.course_lessons l
  where public.is_caller_admin() and l.course_id = p_course_id
  order by l.position asc, l.created_at asc;
$fn$;

grant execute on function public.admin_list_lessons(uuid) to authenticated;
