-- 0028_admin_list_courses_exclude_deleted.sql
--
-- Course delete just became a soft delete (courses.deleted_at, added in
-- 0021, now actually set by UploadCourses' Delete action instead of a real
-- DELETE) so course_purchases/lesson_progress history stays intact. But
-- admin_list_courses() (0011, last redefined for access_mode in 0026) has
-- never filtered on deleted_at, so a "deleted" course would still show up
-- in the admin Courses list and remain manageable at /admin/courses/:id --
-- the soft delete would be invisible from the admin's point of view.
--
-- Purely additive in shape (same columns, same behavior for every live
-- course) -- the only change is excluding rows an admin has already deleted.
-- listCourses()/fetchCourse() (src/lib/courses.js) already add their own
-- `deleted_at is null` filter client-side for the member/public views.

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
    and c.deleted_at is null
  order by c.created_at desc;
$$;

grant execute on function public.admin_list_courses() to authenticated;
