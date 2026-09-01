-- Profile fields collected in the onboarding "Set up your profile" step.
alter table public.profiles
  add column if not exists display_name text,
  add column if not exists city text,
  add column if not exists bio text,
  add column if not exists avatar_url text;

-- profiles had SELECT + INSERT policies but no UPDATE policy yet — needed so
-- users can save their own display name / city / bio / avatar_url.
create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Public bucket for avatar images (profile pictures are meant to be visible
-- to the community, same as usernames).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Uploads are scoped to a per-user folder (avatars/{user_id}/...), enforced
-- by matching the first path segment against the authenticated user's id.
create policy "users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
