-- 0023_admin_list_courses_stripe_product_id.sql
--
-- admin_list_courses() (0011, last redefined for category_id in 0022)
-- predates the courses.stripe_product_id column added in 0021, so it
-- doesn't return it. The admin course editor's new Stripe-price dropdown
-- (CourseDetailsPanel, via the list-stripe-products Edge Function) needs
-- the course's already-stored stripe_product_id to correctly pre-select a
-- product+price pair, not just the price id alone.
--
-- Purely additive: same columns and behavior as before, plus
-- stripe_product_id.

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
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, c.title, c.description, c.category, c.category_id, c.duration_label,
         c.featured, c.price_cents, c.stripe_price_id, c.stripe_product_id, c.visible_tiers,
         c.thumbnail_path, c.video_url, c.created_at
  from public.courses c
  where public.is_caller_admin()
  order by c.created_at desc;
$$;

grant execute on function public.admin_list_courses() to authenticated;
