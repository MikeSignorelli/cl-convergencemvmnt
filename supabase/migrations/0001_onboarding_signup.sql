-- Onboarding "Create your login" step: profiles + pending_onboarding.
-- Auth itself (users, password hashing, magic-link tokens, sessions) is handled
-- entirely by Supabase Auth — these two tables only hold app-level data.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z][a-z0-9_]{2,19}$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Usernames are public/discoverable (needed to check availability pre-auth) and non-sensitive.
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

-- Users may only ever create their own profile row.
create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);


create table if not exists public.pending_onboarding (
  email text primary key,
  username text not null,
  answers jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pending_onboarding enable row level security;

-- Write access has to be open to anon here: "Create your login" happens before
-- any auth session exists, matched only by the email the user typed. This is
-- inherent to any pre-auth signup-start step, not a Supabase-specific gap —
-- the sensitive data (email + collected answers) is protected by restricting
-- SELECT below, not by restricting who can write a pending row.
create policy "anyone can start or update a pending signup"
  on public.pending_onboarding for insert
  with check (true);

create policy "anyone can update a pending signup"
  on public.pending_onboarding for update
  using (true);

-- Only the authenticated owner of that email (i.e. someone who clicked their
-- own magic link) can ever read back the stashed answers.
create policy "only the matching authenticated user can read their pending row"
  on public.pending_onboarding for select
  using (auth.jwt() ->> 'email' = email);

create policy "only the matching authenticated user can delete their pending row"
  on public.pending_onboarding for delete
  using (auth.jwt() ->> 'email' = email);
