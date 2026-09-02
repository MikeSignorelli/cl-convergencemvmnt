-- Deliberately minimal: no video hosting build here. video_url/join_url are
-- external links (e.g. Vimeo, Zoom) rather than uploaded media.
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  visible_tiers text[] not null default '{disciple,leader,pastor}'
    check (visible_tiers <@ array['disciple', 'leader', 'pastor']::text[]),
  thumbnail_path text,
  video_url text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  visible_tiers text[] not null default '{disciple,leader,pastor}'
    check (visible_tiers <@ array['disciple', 'leader', 'pastor']::text[]),
  scheduled_at timestamptz not null,
  join_url text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;
alter table public.live_sessions enable row level security;

create policy "members can view courses visible to their tier"
  on public.courses for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.tier = 'admin' or p.tier = any(courses.visible_tiers))));
create policy "admins can manage courses"
  on public.courses for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'admin'));

create policy "members can view live sessions visible to their tier"
  on public.live_sessions for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.tier = 'admin' or p.tier = any(live_sessions.visible_tiers))));
create policy "admins can manage live sessions"
  on public.live_sessions for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'admin'));

-- Public bucket, low-sensitivity marketing-style thumbnails — same pattern
-- as the avatars bucket, unlike the private resource-files bucket.
insert into storage.buckets (id, name, public)
values ('course-thumbnails', 'course-thumbnails', true)
on conflict (id) do nothing;

create policy "course thumbnails are publicly accessible"
  on storage.objects for select using (bucket_id = 'course-thumbnails');
create policy "admins can upload course thumbnails"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'course-thumbnails'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'admin'));
create policy "admins can update course thumbnails"
  on storage.objects for update to authenticated
  using (bucket_id = 'course-thumbnails'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'admin'));
create policy "admins can delete course thumbnails"
  on storage.objects for delete to authenticated
  using (bucket_id = 'course-thumbnails'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'admin'));
