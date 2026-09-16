-- 0022_admin_list_courses_category_id.sql
--
-- admin_list_courses() (0011, last redefined in 0015) predates the
-- courses.category_id column added in 0021, so it doesn't return it. The
-- admin course editor (ManageCourse -> CourseDetailsPanel) loads its course
-- object through this RPC, so without category_id it has no way to
-- pre-select a course's current category in the new category dropdown.
--
-- Purely additive: same columns and behavior as before, plus category_id.

drop function if exists public.admin_list_courses();

create or replace function public.admin_list_courses()
returns table (
  id uuid,
  title text,
  description text,
  category text,
  category_id uuid,
  duration_label text,
  featured boolean,
  price_cents integer,
  stripe_price_id text,
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
  select c.id, c.title, c.description, c.category, c.category_id, c.duration_label,
         c.featured, c.price_cents, c.stripe_price_id, c.visible_tiers,
         c.thumbnail_path, c.video_url, c.created_at
  from public.courses c
  where public.is_caller_admin()
  order by c.created_at desc;
$$;

grant execute on function public.admin_list_courses() to authenticated;
