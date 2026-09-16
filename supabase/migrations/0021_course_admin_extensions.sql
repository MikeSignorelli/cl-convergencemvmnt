-- 0021_course_admin_extensions.sql
--
-- Groundwork for a fuller course-admin experience: a real categories table
-- (instead of the freeform courses.category text from 0014), course-level
-- metadata an admin panel will want to edit (slug, short description,
-- special-program flag, week count, publish status, sequential-vs-open
-- access, Stripe product id, level/language/outcomes/prerequisites,
-- audit-ish created_by/updated_by, soft delete), lesson-level Vimeo
-- metadata (numeric vimeo_id, duration, an external thumbnail fallback,
-- an open-access flag, audit columns), resource ordering + file metadata,
-- and a server-side size/type limit on the resource-files bucket.
--
-- Everything here is additive: new table, new nullable/defaulted columns,
-- new index, one bucket config UPDATE. No existing column is renamed,
-- dropped, or repurposed -- courses.category (0014) is left completely
-- untouched and still drives the current /programs + admin UI; this
-- migration only backfills the new category_id FK alongside it.

-- ============================================================================
-- 1) course_categories: a real, orderable, admin-managed category list.
--    Independent of visible_tiers (access) same as courses.category was --
--    this just replaces the freeform text with a table an admin can add to,
--    rename, and reorder without touching every course row by hand.
-- ============================================================================
create table if not exists public.course_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.course_categories enable row level security;

-- Public catalog needs this for filtering, same as courses' own "anyone can
-- browse" policy (0015) -- categories aren't sensitive, just structure.
drop policy if exists "anyone can browse course categories" on public.course_categories;
create policy "anyone can browse course categories"
  on public.course_categories for select
  to anon, authenticated
  using (true);

drop policy if exists "admins manage course categories" on public.course_categories;
create policy "admins manage course categories"
  on public.course_categories for all
  to authenticated
  using (public.is_caller_admin())
  with check (public.is_caller_admin());

-- ---------------------------------------------------------------------------
-- Backfill: one course_categories row per distinct existing courses.category
-- value, position assigned by first-appearance order (earliest-created course
-- carrying that category comes first). Written as an explicit loop (rather
-- than a single INSERT...SELECT DISTINCT) so a slug collision between two
-- differently-spelled category names that happen to hyphenate the same way
-- gets a -2/-3 suffix instead of tripping the unique constraint -- on top of
-- the ON CONFLICT (name) DO NOTHING that makes the whole block safe to run
-- more than once.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  v_base_slug text;
  v_slug text;
  v_suffix integer;
  v_position integer := 0;
begin
  for r in
    select category, min(created_at) as first_seen
    from public.courses
    where category is not null
    group by category
    order by min(created_at) asc
  loop
    v_base_slug := trim(both '-' from regexp_replace(lower(regexp_replace(r.category, '[^a-zA-Z0-9]+', '-', 'g')), '-{2,}', '-', 'g'));
    if v_base_slug is null or v_base_slug = '' then
      v_base_slug := 'category';
    end if;

    v_slug := v_base_slug;
    v_suffix := 2;
    while exists (select 1 from public.course_categories where slug = v_slug) loop
      v_slug := v_base_slug || '-' || v_suffix;
      v_suffix := v_suffix + 1;
    end loop;

    insert into public.course_categories (name, slug, position)
    values (r.category, v_slug, v_position)
    on conflict (name) do nothing;

    v_position := v_position + 1;
  end loop;
end;
$$;

-- ============================================================================
-- 2) courses: admin-panel metadata. All additive -- nullable or defaulted,
--    nothing existing is touched. category_id sits ALONGSIDE the old
--    `category` text column (0014), which stays exactly as-is since it's
--    still read elsewhere in the app.
-- ============================================================================
alter table public.courses
  add column if not exists category_id uuid references public.course_categories(id),
  add column if not exists slug text,
  add column if not exists short_description text,
  add column if not exists is_special_program boolean not null default false,
  add column if not exists weeks integer,
  add column if not exists status text not null default 'published'
    check (status in ('draft', 'published', 'archived')),
  add column if not exists access_mode text not null default 'open'
    check (access_mode in ('sequential', 'open')),
  add column if not exists stripe_product_id text,
  add column if not exists level text,
  add column if not exists language text,
  add column if not exists learning_outcomes text,
  add column if not exists prerequisites text,
  add column if not exists created_by uuid references public.profiles(id),
  add column if not exists updated_by uuid references public.profiles(id),
  add column if not exists deleted_at timestamptz;
-- (courses.created_by already exists from 0008 -- this `add column if not
-- exists` is a no-op for it, kept only so the full column list reads as one
-- unit; updated_by is the actually-new one.)

-- Explicit backfill for every pre-existing row, even though NOT NULL DEFAULT
-- already makes every row 'published' the moment the column above is added
-- (the ADD COLUMN backfills existing rows with the default in one pass) --
-- spelled out here per spec rather than left implicit.
update public.courses set status = 'published';

-- ---------------------------------------------------------------------------
-- Backfill slug from title for every row that doesn't have one yet: lowercase,
-- non-alphanumeric runs to a single hyphen, trim leading/trailing hyphens.
-- Looped in creation order so collisions between two similarly-titled courses
-- resolve deterministically -- the earlier course keeps the bare slug, later
-- ones get -2, -3, etc.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  v_base_slug text;
  v_slug text;
  v_suffix integer;
begin
  for r in
    select id, title
    from public.courses
    where slug is null
    order by created_at asc, id asc
  loop
    v_base_slug := trim(both '-' from regexp_replace(lower(regexp_replace(r.title, '[^a-zA-Z0-9]+', '-', 'g')), '-{2,}', '-', 'g'));
    if v_base_slug is null or v_base_slug = '' then
      v_base_slug := 'course';
    end if;

    v_slug := v_base_slug;
    v_suffix := 2;
    while exists (
      select 1 from public.courses c2
      where c2.slug = v_slug and c2.id <> r.id
    ) loop
      v_slug := v_base_slug || '-' || v_suffix;
      v_suffix := v_suffix + 1;
    end loop;

    update public.courses set slug = v_slug where id = r.id;
  end loop;
end;
$$;

-- Partial + unique so a future soft-deleted course (deleted_at set) can't
-- block a new course from reusing its slug, while still enforcing uniqueness
-- among live/undeleted courses.
create unique index if not exists courses_slug_unique_idx
  on public.courses (slug)
  where slug is not null and deleted_at is null;

-- Link the new FK using the existing text column as the join key -- courses
-- .category itself is left completely intact (not cleared, not dropped).
update public.courses c
set category_id = cc.id
from public.course_categories cc
where cc.name = c.category
  and c.category_id is null;

-- ============================================================================
-- 3) course_lessons: Vimeo metadata + open-access flag + audit columns.
--    thumbnail_url is a full external URL (a Vimeo-hosted thumbnail),
--    deliberately distinct from thumbnail_path (a Storage object path for an
--    uploaded file, from 0017) -- the two are alternate sources, not a rename.
-- ============================================================================
alter table public.course_lessons
  add column if not exists vimeo_id text,
  add column if not exists duration_seconds numeric,
  add column if not exists duration_source text
    check (duration_source in ('auto', 'manual')),
  add column if not exists thumbnail_url text,
  add column if not exists is_open_access boolean not null default false,
  add column if not exists created_by uuid references public.profiles(id),
  add column if not exists updated_by uuid references public.profiles(id);

-- Best-effort backfill: pull the numeric Vimeo id out of video_url for both
-- "https://vimeo.com/123456789" and "https://vimeo.com/123456789/abcdef"
-- (a private-link hash after the id) -- the digits immediately after
-- "vimeo.com/" are the id either way. Rows that don't match (a non-Vimeo
-- video_url, or one already missing/blank) are simply left with vimeo_id
-- null; nothing here can fail the migration.
update public.course_lessons
set vimeo_id = (regexp_match(video_url, 'vimeo\.com/(\d+)'))[1]
where video_url is not null
  and video_url ~ 'vimeo\.com/\d+'
  and vimeo_id is null;

-- ============================================================================
-- 4) resources: display ordering + stored file metadata for the admin
--    resource manager. created_by already exists on this table (0007), so
--    it's intentionally not repeated here.
-- ============================================================================
alter table public.resources
  add column if not exists position integer not null default 0,
  add column if not exists file_size integer,
  add column if not exists mime_type text;

-- Backfill position per course_id group (course_id IS NULL forms its own
-- group under partition-by semantics, so general/unlinked resources are
-- ordered separately from every course's own resources) by created_at order.
update public.resources r
set position = ranked.rn
from (
  select id, row_number() over (partition by course_id order by created_at asc) - 1 as rn
  from public.resources
) ranked
where ranked.id = r.id;

-- ============================================================================
-- 5) Storage: enforce the 25MB PDF/DOCX rule for resource uploads at the
--    storage layer itself, so it holds even if a client-side check is ever
--    skipped or bypassed. Only the resource-files bucket (0007) is touched --
--    course-thumbnails and any other bucket are left alone.
-- ============================================================================
update storage.buckets
set file_size_limit = 26214400, -- 25 * 1024 * 1024 bytes
    allowed_mime_types = array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
where id = 'resource-files';
