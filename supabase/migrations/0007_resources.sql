create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  visible_tiers text[] not null default '{disciple,leader,pastor}'
    check (visible_tiers <@ array['disciple', 'leader', 'pastor']::text[]),
  file_path text,     -- storage object path in the resource-files bucket
  external_url text,  -- alternative to a file: a link-based resource
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint resources_file_or_url check (file_path is not null or external_url is not null)
);

alter table public.resources enable row level security;

create policy "members can view resources visible to their tier"
  on public.resources for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.tier = 'admin' or p.tier = any(resources.visible_tiers))
    )
  );

create policy "admins can manage resources"
  on public.resources for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'admin'));

-- Private bucket: unlike avatars, resources are tier-gated, so a public URL
-- would leak content past the tier check. Downloads go through a signed URL
-- generated at request time instead.
insert into storage.buckets (id, name, public)
values ('resource-files', 'resource-files', false)
on conflict (id) do nothing;

create policy "members can download resource files for their tier"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'resource-files'
    and exists (
      select 1 from public.resources r
      join public.profiles p on p.id = auth.uid()
      where r.file_path = storage.objects.name
        and (p.tier = 'admin' or p.tier = any(r.visible_tiers))
    )
  );

create policy "admins can upload resource files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'resource-files'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'admin')
  );

create policy "admins can update resource files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'resource-files'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'admin')
  );

create policy "admins can delete resource files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'resource-files'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'admin')
  );
