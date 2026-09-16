-- 0026_admin_list_courses_access_mode.sql
--
-- admin_list_courses() (0011, last redefined for the 0021 metadata columns
-- in 0024) predates courses.access_mode -- also added in 0021, but missed
-- by 0024's column list. The admin course editor's Sequential-vs-Open
-- toggle (CourseDetailsPanel) needs this to show a course's already-saved
-- access mode instead of always defaulting the toggle back to "open".
--
-- Purely additive: same columns and behavior as before, plus access_mode.

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
  stripe_product_id text,
  visible_tiers text[],
  thumbnail_path text,
  video_url text,
  slug text,
  short_description text,
  is_special_program boolean,
  weeks integer,
  status text,
  access_mode text,
  level text,
  language text,
  learning_outcomes text,
  prerequisites text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, c.title, c.description, c.category, c.category_id, c.duration_label,
         c.featured, c.price_cents, c.stripe_price_id, c.stripe_product_id, c.visible_tiers,
         c.thumbnail_path, c.video_url, c.slug, c.short_description, c.is_special_program,
         c.weeks, c.status, c.access_mode, c.level, c.language, c.learning_outcomes, c.prerequisites,
         c.created_at
  from public.courses c
  where public.is_caller_admin()
  order by c.created_at desc;
$$;

grant execute on function public.admin_list_courses() to authenticated;
