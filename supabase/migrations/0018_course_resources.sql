-- Resources can be attached to a course. Course-linked resources (the content
-- PDFs + the end-of-course summary doc) are gated by COURSE access — the same
-- rule as the course itself (admin / active member + tier / completed purchase)
-- — while general resources (course_id null) stay tier-gated as before.

alter table public.resources
  add column if not exists course_id uuid references public.courses(id) on delete cascade;

-- General (non-course) resources: keep the tier gate, scoped to course_id null.
drop policy if exists "members can view resources visible to their tier" on public.resources;
drop policy if exists "members can view general resources for their tier" on public.resources;
create policy "members can view general resources for their tier"
  on public.resources for select to authenticated
  using (
    course_id is null and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and (p.tier = 'admin' or p.tier = any(resources.visible_tiers))
    )
  );

-- Course-linked resources: visible to anyone who can access the parent course.
drop policy if exists "members can view resources for accessible courses" on public.resources;
create policy "members can view resources for accessible courses"
  on public.resources for select to authenticated
  using (
    course_id is not null and (
      public.is_caller_admin()
      or exists (
        select 1 from public.profiles p
        join public.courses c on c.id = resources.course_id
        where p.id = auth.uid() and p.subscription_status = 'active' and p.tier = any(c.visible_tiers)
      )
      or exists (
        select 1 from public.course_purchases
        where user_id = auth.uid() and course_id = resources.course_id and status = 'completed'
      )
    )
  );

-- Storage download: allow course-access holders to sign course-linked files
-- (mirrors the table policy). Replaces the tier-only download policy.
drop policy if exists "members can download resource files for their tier" on storage.objects;
drop policy if exists "members can download resource files" on storage.objects;
create policy "members can download resource files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'resource-files' and exists (
      select 1 from public.resources r
      join public.profiles p on p.id = auth.uid()
      where r.file_path = storage.objects.name and (
        (r.course_id is null and (p.tier = 'admin' or p.tier = any(r.visible_tiers)))
        or (r.course_id is not null and (
          p.tier = 'admin'
          or exists (
            select 1 from public.courses c
            where c.id = r.course_id and p.subscription_status = 'active' and p.tier = any(c.visible_tiers)
          )
          or exists (
            select 1 from public.course_purchases cp
            where cp.user_id = p.id and cp.course_id = r.course_id and cp.status = 'completed'
          )
        ))
      )
    )
  );
