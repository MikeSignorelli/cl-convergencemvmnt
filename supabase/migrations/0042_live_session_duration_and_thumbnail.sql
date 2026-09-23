-- Live sessions redesign: the admin "Duration (minutes)" field was already
-- being sent to Zoom (create-live-session) but never actually stored on our
-- own row, so the member-facing "is this live right now" check had no upper
-- bound (scheduled_at onward, forever) and there was no way to show a real
-- "runs until" time. thumbnail_path lets an admin set a custom image for the
-- new card/detail views, same shape as courses.thumbnail_path.
alter table public.live_sessions
  add column duration_minutes integer not null default 60,
  add column thumbnail_path text;

-- Public bucket, same pattern as course-thumbnails (migration 0008): low-
-- sensitivity marketing-style images, publicly readable, admin-only writes.
insert into storage.buckets (id, name, public)
values ('live-session-thumbnails', 'live-session-thumbnails', true)
on conflict (id) do nothing;

create policy "live session thumbnails are publicly accessible"
  on storage.objects for select using (bucket_id = 'live-session-thumbnails');
create policy "admins can upload live session thumbnails"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'live-session-thumbnails'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'admin'));
create policy "admins can update live session thumbnails"
  on storage.objects for update to authenticated
  using (bucket_id = 'live-session-thumbnails'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'admin'));
create policy "admins can delete live session thumbnails"
  on storage.objects for delete to authenticated
  using (bucket_id = 'live-session-thumbnails'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'admin'));
