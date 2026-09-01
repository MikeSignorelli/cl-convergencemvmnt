-- The onboarding wizard's step 1 (Disciple / Leader / Pastor) was being
-- collected into pending_onboarding.answers but never copied into profiles —
-- completeSignup() only ever inserted id + username, so the tier was
-- discarded the moment the pending row got cleaned up. This column plus the
-- matching insert (see onboardingSignup.js) fixes that going forward.
alter table public.profiles
  add column if not exists tier text check (tier in ('disciple', 'leader', 'pastor'));
