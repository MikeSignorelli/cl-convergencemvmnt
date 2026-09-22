-- Explicit "Membership vs Courses" content label, replacing the implicit
-- price_cents > 0 heuristic listStandaloneCourses() used to derive the same
-- distinction. Display/filtering only -- per explicit decision this does
-- NOT affect who can watch a course (that's the membership-or-purchase
-- rule in migration 0034); it's purely for admin organization and the
-- public /programs catalog.
--
-- Named `listing_type` (not `course_type`) to avoid colliding with the
-- existing `is_special_program` toggle, which the admin UI already labels
-- "Course type" (Regular course vs Special Program) -- a different axis
-- entirely.
alter table public.courses
  add column if not exists listing_type text not null default 'membership'
    check (listing_type in ('membership', 'course'));

-- migration 0031 replaced courses' whole-table SELECT grant with an
-- explicit column allowlist for anon/authenticated -- a new column isn't
-- selectable by them until it's added to that allowlist too.
grant select (listing_type) on public.courses to anon, authenticated;

-- Backfill from the existing implicit rule so nothing changes visually on
-- day one: a course that was already priced for standalone sale keeps
-- reading as "Course" (sold on its own); the rest read as "Membership"
-- (bundled-only today).
update public.courses set listing_type = 'course' where price_cents > 0;

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
  listing_type text,
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
         c.listing_type, c.thumbnail_path, c.video_url, c.slug, c.short_description, c.is_special_program,
         c.weeks, c.status, c.access_mode, c.level, c.language, c.learning_outcomes, c.prerequisites,
         c.created_at
  from public.courses c
  where public.is_caller_admin()
    and c.deleted_at is null
  order by c.created_at desc;
$$;
