-- The public marketing site has a separate "Courses & Mentorship" catalog
-- (/programs) alongside the $49/mo membership -- someone not ready to
-- subscribe can buy access to a single course outright. Every course is
-- still free with an active membership (migration 0013); a completed
-- standalone purchase is now an ADDITIONAL way to unlock the same course,
-- not a replacement for the subscription+tier check.
create or replace function public.get_course_video_url(p_course_id uuid)
returns text
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_video_url text;
  v_allowed boolean;
begin
  select public.is_caller_admin() or exists (
    select 1
    from public.profiles p
    join public.courses c on c.id = p_course_id
    where p.id = auth.uid()
      and p.subscription_status = 'active'
      and p.tier = any(c.visible_tiers)
  ) or exists (
    select 1 from public.course_purchases
    where user_id = auth.uid() and course_id = p_course_id and status = 'completed'
  ) into v_allowed;

  if not v_allowed then
    return null;
  end if;

  select video_url into v_video_url from public.courses where id = p_course_id;
  return v_video_url;
end;
$$;

-- Admin Upload Courses needs to see/set price_cents + stripe_price_id again
-- now that they're back in active use -- drop first since changing OUT
-- columns isn't allowed via create-or-replace.
drop function if exists public.admin_list_courses();

create or replace function public.admin_list_courses()
returns table (
  id uuid,
  title text,
  description text,
  category text,
  duration_label text,
  featured boolean,
  price_cents integer,
  stripe_price_id text,
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
  select c.id, c.title, c.description, c.category, c.duration_label, c.featured,
         c.price_cents, c.stripe_price_id, c.visible_tiers, c.thumbnail_path,
         c.video_url, c.created_at
  from public.courses c
  where public.is_caller_admin()
  order by c.created_at desc;
$$;

grant execute on function public.admin_list_courses() to authenticated;

-- The catalog page is public marketing (no login required to see prices/
-- browse), so anon needs SELECT too -- video_url stays hidden either way
-- via the column-level revoke from migration 0011.
drop policy if exists "authenticated members can browse all courses" on public.courses;
create policy "anyone can browse courses"
  on public.courses for select to anon, authenticated
  using (true);

-- Seed real standalone prices on the more substantial, flagship-style
-- courses -- lighter daily-series content stays membership-only (price 0,
-- not shown on the standalone catalog).
update public.courses set price_cents = 49700 where title = 'Inherit Your Freedom: 90-Day Intensive';
update public.courses set price_cents = 19700 where title = 'The Breakthrough Protocol';
update public.courses set price_cents = 24700 where title = 'Brain Recomposition';
update public.courses set price_cents = 14700 where title = 'Accelerated Freedom';
update public.courses set price_cents = 29700 where title = 'Purpose & Legacy Lab';
update public.courses set price_cents = 49700 where title = 'The Movement: Church Systems';
update public.courses set price_cents = 24700 where title = 'Marriage as a Pastor';
update public.courses set price_cents = 19700 where title = 'Sustainable Ministry';
