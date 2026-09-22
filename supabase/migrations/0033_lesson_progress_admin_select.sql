-- lesson_progress's only policy ("users manage their own progress", 0019)
-- is `for all using (user_id = auth.uid())` -- correct for members, but it
-- also meant an admin's own plain client query only ever saw their own
-- rows, never any member's. The new admin Analytics page (course
-- engagement: avg watch %, lessons completed/started) needs to read every
-- member's progress, the same way admin already reads every row of
-- course_purchases and billing_transactions.
--
-- Added as its own SELECT-only policy rather than folding `or
-- is_caller_admin()` into the existing FOR ALL policy: RLS policies for the
-- same command are OR'd together, so this only widens what admin can READ
-- -- insert/update/delete stay governed solely by the existing policy,
-- meaning admin still can't write to another member's progress row.
create policy "admins view all lesson progress"
  on public.lesson_progress for select to authenticated
  using (public.is_caller_admin());
