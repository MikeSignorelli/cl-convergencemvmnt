-- Per-member watch progress for an episode (lesson). Drives the dashboard
-- "Continue watching" card (real % of the real video length) and resume-where-
-- you-left-off in the player. Each member only ever sees/writes their own rows.

create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  seconds numeric not null default 0,
  duration numeric,
  percent numeric not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

grant select, insert, update, delete on public.lesson_progress to authenticated;

drop policy if exists "users manage their own progress" on public.lesson_progress;
create policy "users manage their own progress"
  on public.lesson_progress for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists lesson_progress_user_updated_idx
  on public.lesson_progress (user_id, updated_at desc);
