-- CRITICAL FIX: column-level REVOKE does not narrow a broader table-level
-- GRANT in Postgres. Every previous "hide this one sensitive column"
-- migration (0011's courses.video_url, 0017's course_lessons.video_url,
-- 0030's payment_settings.secret_key) issued `revoke select (col) on
-- table from anon, authenticated` while `anon`/`authenticated` still held
-- Supabase's default whole-table `grant select on table` from table
-- creation -- so the column-level revoke never actually took effect and
-- the "protected" column stayed fully readable by anyone via a plain
-- `select col from table` over PostgREST.
--
-- Confirmed live and exploitable before this migration: an unauthenticated
-- request to /rest/v1/course_lessons?select=video_url and
-- /rest/v1/courses?select=video_url returned real Vimeo URLs for every
-- lesson and course, including paywalled/purchased-only courses --
-- bypassing the entire membership and course-purchase paywall.
-- payment_settings.secret_key was NOT actually exposed the same way (its
-- RLS policy has no `anon` grant and requires is_caller_admin() for
-- `authenticated`, so row-level security alone already blocked every
-- non-admin row) but is fixed here too for consistency and defense in
-- depth, since it relied on the same broken assumption.
--
-- The only correct way to hide one column while a table stays otherwise
-- browsable: revoke SELECT on the whole table, then re-grant SELECT on an
-- explicit column allowlist. Nothing in the app needs to change --
-- listCourses/fetchCourse/the member episode list already deliberately
-- omit video_url from their own .select() lists, and the only code paths
-- that read video_url/secret_key already go through security-definer
-- functions (get_course_video_url, get_lesson_video_url,
-- admin_list_courses, admin_list_lessons, get_stripe_settings), which
-- execute as the function owner and are unaffected by grants on the
-- calling role.

revoke select on public.courses from anon, authenticated;
grant select (
  id, title, description, visible_tiers, thumbnail_path, created_by,
  created_at, price_cents, stripe_price_id, category, duration_label,
  featured, category_id, slug, short_description, is_special_program,
  weeks, status, access_mode, stripe_product_id, level, language,
  learning_outcomes, prerequisites, updated_by, deleted_at
) on public.courses to anon, authenticated;

revoke select on public.course_lessons from anon, authenticated;
grant select (
  id, course_id, title, description, extra_info, thumbnail_path,
  duration_label, release_at, "position", created_by, created_at,
  week_number, vimeo_id, duration_seconds, duration_source,
  thumbnail_url, is_open_access, updated_by
) on public.course_lessons to anon, authenticated;

revoke select on public.payment_settings from anon, authenticated;
grant select (
  provider, publishable_key, updated_by, updated_at
) on public.payment_settings to anon, authenticated;
