import { supabase } from './supabaseClient'

// Username: 3-20 chars, lowercase letters/digits/underscore, must start with a letter.
// Matches the check constraint on public.profiles.username.
export const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,19}$/
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeUsername(raw) {
  return raw.trim().toLowerCase()
}

export function normalizeEmail(raw) {
  return raw.trim().toLowerCase()
}

// Checks both real accounts (profiles) and other in-flight signups
// (pending_onboarding) via a security-definer RPC — anon can't read either
// table directly, so this is the only way to check availability pre-auth.
export async function isUsernameAvailable(username) {
  const { data, error } = await supabase.rpc('is_username_available', {
    check_username: username,
  })
  if (error) throw error
  return data === true
}

// Starts (or restarts) a signup: stashes the username + onboarding answers
// collected so far against this email, then sends the magic-link email.
// Upserts on email, so resubmitting the same email reuses the existing
// pending record instead of creating a duplicate — and re-sending the link
// naturally supersedes any earlier one (Supabase's OTP tokens are single-use
// and short-lived on their own).
//
// Supabase returns the same generic (no-error) response whether this email
// belongs to a brand-new signup or an existing, fully-registered account —
// intentionally, so we never leak account existence to the client. If the
// email is already a real member, Supabase emails them a sign-in link
// instead of a signup-confirmation link, and SetPassword detects that case
// after they click it (see completeSignup / the "already-member" check).
export async function startSignup({ username, email, answers }) {
  // Routed through a security-definer RPC rather than a direct table upsert:
  // Postgres RLS requires SELECT-visibility into any conflicting row to plan
  // an `ON CONFLICT DO UPDATE`, which is incompatible with locking pending
  // signups down from anonymous reads. See migration 0003 for the full story.
  const { error: rpcError } = await supabase.rpc('start_pending_onboarding', {
    p_email: email,
    p_username: username,
    p_answers: answers,
  })
  if (rpcError) throw rpcError

  await sendSignupEmail(email)
}

export async function sendSignupEmail(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/signup/complete`,
      shouldCreateUser: true,
    },
  })
  if (error) throw error
}

export async function fetchPendingOnboarding(email) {
  const { data, error } = await supabase
    .from('pending_onboarding')
    .select('username, answers')
    .eq('email', email)
    .maybeSingle()
  if (error) throw error
  return data
}

// Consumes the (already-authenticated-via-magic-link) session: sets the
// password, creates the profile row from the stashed pending signup, and
// cleans up the pending record. Returns the stashed onboarding answers so the
// caller can rehydrate the wizard.
export async function completeSignup({ password }) {
  const { data, error: updateError } = await supabase.auth.updateUser({ password })
  if (updateError) throw updateError

  const user = data.user
  const email = user.email

  const pending = await fetchPendingOnboarding(email)
  if (!pending) {
    return { user, answers: null }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: user.id, username: pending.username, tier: pending.answers?.tier ?? null })
  // 23505 (unique violation) here means either this profile already exists
  // (e.g. the password screen was submitted twice) or — rarely — someone else
  // claimed the same username in the meantime. Either way we don't want to
  // hard-fail the signup over it; nothing downstream currently depends on the
  // username being guaranteed unique-at-this-exact-moment.
  if (profileError && profileError.code !== '23505') throw profileError

  await supabase.from('pending_onboarding').delete().eq('email', email)

  return { user, answers: pending.answers }
}

export async function hasProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return !!data
}
