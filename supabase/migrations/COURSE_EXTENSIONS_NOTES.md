# Course admin extensions — migration notes (0021–0029)

This note covers the migration set added while building out the course
admin panel: real categories, richer course/lesson metadata, an admin
Stripe-price dropdown, sequential episode gating, soft delete, and a course
health-check job. It's a companion to the SQL files themselves, not a
replacement for reading them — each file still carries its own `--` header
comment explaining the *why*; this doc is the *apply it in order* checklist.

Nothing here renames or drops an existing column. Every migration in this
set is additive: new tables, new nullable/defaulted columns, or a
`create or replace function` that returns a superset of what it returned
before. Existing courses, episodes, purchases, and the Stripe/webhook flows
are unaffected until an admin actually uses one of the new fields.

## (a) What each file does, in order

1. **0021_course_admin_extensions.sql** — the big additive migration:
   - `course_categories` table (real, orderable categories), backfilled
     one row per distinct existing `courses.category` value.
   - `courses` gains `category_id`, `slug`, `short_description`,
     `is_special_program`, `weeks`, `status`, `access_mode`,
     `stripe_product_id`, `level`, `language`, `learning_outcomes`,
     `prerequisites`, `updated_by`, `deleted_at` — all backfilled
     (`status` → `'published'`, `slug` generated from title, `category_id`
     linked via the old `category` text).
   - `course_lessons` gains Vimeo metadata (`vimeo_id`, `duration_seconds`,
     `duration_source`, `thumbnail_url`), `is_open_access`, `updated_by`
     (`vimeo_id` best-effort backfilled from existing `video_url`s).
   - `resources` gains `position` (backfilled per `course_id` group),
     `file_size`, `mime_type`.
   - Tightens the `resource-files` storage bucket to a 25MB PDF/DOCX limit.
2. **0022_admin_list_courses_category_id.sql** — redefines
   `admin_list_courses()` to also return `category_id` (existed in the
   table since 0021, but the RPC hadn't caught up yet).
3. **0023_admin_list_courses_stripe_product_id.sql** — redefines
   `admin_list_courses()` again, adding `stripe_product_id`.
4. **0024_admin_list_courses_admin_extensions.sql** — redefines
   `admin_list_courses()` again, adding the rest of the 0021 course-level
   metadata (`slug`, `short_description`, `is_special_program`, `weeks`,
   `status`, `level`, `language`, `learning_outcomes`, `prerequisites`).
5. **0025_admin_list_lessons_admin_extensions.sql** — redefines
   `admin_list_lessons(p_course_id)` to add the 0021 lesson-level metadata
   (`vimeo_id`, `duration_seconds`, `duration_source`, `thumbnail_url`,
   `is_open_access`, `created_by`, `updated_by`).
6. **0026_admin_list_courses_access_mode.sql** — redefines
   `admin_list_courses()` once more, adding `access_mode` (added in 0021,
   missed by 0024's column list).
7. **0027_sequential_lesson_gate.sql** — redefines
   `get_lesson_video_url(p_lesson_id)` to actually enforce
   `access_mode = 'sequential'`: a non-admin must have completed the
   immediately-preceding lesson (by `week_number`, `position`,
   `created_at` order) before this one's video is served, unless the
   lesson is flagged `is_open_access`. Every course defaults to `'open'`
   (from 0021) and is unaffected unless an admin switches it.
8. **0028_admin_list_courses_exclude_deleted.sql** — redefines
   `admin_list_courses()` a final time to filter out `deleted_at is not
   null` rows, so a soft-deleted course (see UploadCourses' Delete action)
   stops appearing in the admin list.
9. **0029_course_health_flags.sql** — new `course_health_flags` table:
   one row per detected issue (`missing_video`, `upcoming_no_video`,
   `broken_link`) on a `course_lessons` row, written by the new
   `course-health-check` Edge Function and read by the admin course list's
   health banner (`src/lib/courseHealth.js`).

Each `admin_list_courses()` / `admin_list_lessons()` redefinition
(0022–0026, 0028) is a `drop function if exists` followed by
`create or replace function` with a wider column list — that's why there
are so many small ones back to back rather than one migration: each was
added when a specific new admin-panel field turned out to need it.

## (b) Applying these to the live Supabase project

This project's migrations have been applied by hand through the **Supabase
Dashboard SQL Editor**, one file at a time, in order — not via a CLI
`db push`. Follow the same process for this set:

1. Open the project in the **Supabase Dashboard** → **SQL Editor**.
2. Open `supabase/migrations/0021_course_admin_extensions.sql` locally,
   copy its full contents, paste into a new SQL Editor query, and click
   **Run**. Confirm it completes without error before moving on.
3. Repeat step 2 for each file in order — **0022, 0023, 0024, 0025, 0026,
   0027, 0028, 0029** — always one file per run, always in ascending
   number order. Every file is written with `if not exists` / `create or
   replace` guards, so re-running a file that already applied cleanly is
   harmless, but running them out of order is not guaranteed to be (0022–
   0026/0028 each replace the *previous* migration's version of
   `admin_list_courses()`, so applying them out of order just means an
   intermediate version briefly exists — not harmful, but pointless; still
   apply in order).
4. After 0021 runs, spot-check in the Table Editor that
   `course_categories` has one row per pre-existing category, and that a
   few existing courses now show a non-null `slug` and `category_id`.
5. After 0029 runs, confirm `course_health_flags` exists (Table Editor)
   before deploying/scheduling the `course-health-check` function below —
   the function's first insert will fail if the table isn't there yet.

## (c) Env vars / secrets

- `STRIPE_SECRET_KEY` — **already set** from the existing Stripe setup
  (see `supabase/functions/README.md`). Course purchases charge directly
  off each course's `price_cents` via this key — no Stripe Product/Price
  needs to be pre-created per course.
- `COURSE_HEALTH_SECRET` — **new**. Set it before scheduling
  `course-health-check` (Supabase Dashboard → Edge Functions → Secrets, or
  CLI):

  ```bash
  supabase secrets set COURSE_HEALTH_SECRET=some-long-random-string
  ```

  See `supabase/functions/README.md` §6 for exactly how this is used (the
  `x-cron-secret` header, same pattern as `SETUP_REMINDER_SECRET`).

## (d) Scheduling course-health-check

There's no in-repo cron config for this (same as `send-setup-reminders` —
neither function ships a schedule as code). Schedule it the same way
`send-setup-reminders` is scheduled: from the **Supabase Dashboard →
Edge Functions → Cron** (or any external scheduler capable of an
authenticated HTTPS POST on a recurring basis), pointed at:

```
https://<project-ref>.supabase.co/functions/v1/course-health-check
```

with header `x-cron-secret: <COURSE_HEALTH_SECRET>`. A daily run is a
reasonable starting cadence; `daysAhead` (default 3) controls how far
ahead it looks for episodes releasing soon with no video yet, independent
of how often the job itself runs.

The same endpoint also has a second, admin-JWT-authenticated caller — the
"Check Vimeo links now" button on the admin course list — for an
on-demand run in between scheduled sweeps. That path needs no secret and
no scheduling; it just needs the function deployed.

## (e) Before this is usable: reinstall + test

`vitest` was added as a new dev dependency in this build (there was no
test runner in this project before). After pulling these changes:

```bash
npm install
npm test
```

`npm test` (`vitest run`) should pass cleanly — it covers the new pure
`src/lib` utilities (slug generation, Vimeo parsing, CSV import) added
alongside this admin work, plus the pre-existing billing tests. `npm run
build` should also still succeed unchanged.
