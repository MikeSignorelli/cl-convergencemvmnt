-- Course Library redesign: courses are now grouped into marketing
-- categories (e.g. "Freedom & Healing", "Church Systems · Pastors") that
-- are independent of visible_tiers (which still controls access) — a
-- category is just how the library groups/filters cards, not who can see
-- them. duration_label is deliberately freeform text rather than
-- structured weeks/episodes columns: real course copy mixes "12 weeks ·
-- 36 episodes" with "Monthly · members only" and "6 weeks · with Julie
-- Thompson", which don't fit one shape. featured marks the single course
-- shown in the library's hero banner.
alter table public.courses
  add column if not exists category text,
  add column if not exists duration_label text,
  add column if not exists featured boolean not null default false;

-- Admin Upload Courses needs to see/manage the new columns too.
drop function if exists public.admin_list_courses();

create or replace function public.admin_list_courses()
returns table (
  id uuid,
  title text,
  description text,
  category text,
  duration_label text,
  featured boolean,
  visible_tiers text[],
  thumbnail_path text,
  video_url text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, c.title, c.description, c.category, c.duration_label, c.featured,
         c.visible_tiers, c.thumbnail_path, c.video_url, c.created_at
  from public.courses c
  where public.is_caller_admin()
  order by c.created_at desc;
$$;

grant execute on function public.admin_list_courses() to authenticated;
