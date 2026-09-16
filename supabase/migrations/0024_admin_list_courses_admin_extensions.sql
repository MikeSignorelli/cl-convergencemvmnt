-- 0024_admin_list_courses_admin_extensions.sql
--
-- admin_list_courses() (0011, last redefined for stripe_product_id in 0023)
-- predates the courses admin-metadata columns added in 0021 (slug,
-- short_description, is_special_program, weeks, status, level, language,
-- learning_outcomes, prerequisites). The admin course editor
-- (ManageCourse -> CourseDetailsPanel) loads its course object exclusively
-- through this RPC, so without these columns it has no way to pre-fill the
-- new Slug / Short description / Status / Course type / Weeks / Level /
-- Language / Learning outcomes / Prerequisites fields with a course's
-- already-saved values.
--
-- Purely additive: same columns and behavior as before, plus the 0021
-- metadata columns.

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
         c.weeks, c.status, c.level, c.language, c.learning_outcomes, c.prerequisites,
         c.created_at
  from public.courses c
  where public.is_caller_admin()
  order by c.created_at desc;
$$;

grant execute on function public.admin_list_courses() to authenticated;
