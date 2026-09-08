-- Courses are no longer purchased individually. Access to a course is now
-- just: is this course's visible_tiers set include the member's own tier,
-- gated on an active membership subscription the same way the dashboard
-- already is (see Dashboard's PaymentWall) -- being signed in is no longer
-- enough on its own, which actually matches the copy that already promised
-- this ("courses... unlock once your $49/mo membership payment is
-- confirmed") even though the code never enforced it.
--
-- price_cents / stripe_price_id on courses and the course_purchases table
-- are deliberately left in place, unused, rather than dropped -- same
-- precedent as visible_tiers in migration 0011, in case per-course pricing
-- is wanted again later.
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
  ) into v_allowed;

  if not v_allowed then
    return null;
  end if;

  select video_url into v_video_url from public.courses where id = p_course_id;
  return v_video_url;
end;
$$;

-- Admin Upload Courses no longer shows per-course pricing -- drop first
-- since changing OUT columns isn't allowed via create-or-replace.
drop function if exists public.admin_list_courses();

create or replace function public.admin_list_courses()
returns table (
  id uuid,
  title text,
  description text,
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
  select c.id, c.title, c.description, c.visible_tiers, c.thumbnail_path,
         c.video_url, c.created_at
  from public.courses c
  where public.is_caller_admin()
  order by c.created_at desc;
$$;

grant execute on function public.admin_list_courses() to authenticated;
