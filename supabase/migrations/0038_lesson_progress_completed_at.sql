-- Missed in 0037: the spec's data model calls for a completed_at timestamp
-- (when an episode was finished), distinct from the existing `completed`
-- boolean and from `updated_at` (which changes on every heartbeat, not just
-- on completion). Needed so completion can be set once and never
-- auto-un-set, and so admin reporting can compute completion timing.
alter table public.lesson_progress
  add column if not exists completed_at timestamptz;

update public.lesson_progress
set completed_at = updated_at
where completed = true and completed_at is null;
