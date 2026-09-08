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

// Pre-flight check so the signup form can tell someone "that email is
// already registered with Google" before sending a magic link they'll
// never need — rather than letting them discover it only after checking
// their inbox. See migration 0010 for why this is safe to expose pre-auth.
export async function checkEmailSignupStatus(email) {
  const { data, error } = await supabase.rpc('check_email_signup_status', {
    p_email: email,
  })
  if (error) throw error
  return data || { exists: false, providers: [] }
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
  // Someone who clicked "Continue with Google" and then backed out (or the
  // OAuth round trip just never came back) leaves a stash sitting in
  // localStorage for up to GOOGLE_SIGNUP_MAX_AGE_MS — see stashGoogleSignup.
  // Submitting the email form is an explicit choice to use this path
  // instead, so that stash is now stale and must not be allowed to hijack
  // this (or any later) magic-link click on /signup/complete: without this,
  // clicking the just-emailed link would silently skip the password step
  // and create the profile from the OLD stashed username instead of the one
  // just entered here (see SetPassword's hasGoogleSignupStash check).
  clearGoogleSignupStash()

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
  if (error) {
    // Supabase's own message here ("Email rate limit exceeded", a raw 429)
    // is meaningless to a customer and doesn't say what to do about it.
    if (error.status === 429 || /rate limit/i.test(error.message || '')) {
      throw new Error("We're sending a lot of signup emails right now — please try again in a few minutes.")
    }
    throw error
  }
  markSignupPending(email)
}

const SIGNUP_PENDING_KEY = 'onboarding_signup_pending'
const SIGNUP_PENDING_MAX_AGE_MS = 24 * 60 * 60 * 1000 // matches the link's own stated 24h validity

// The "Check your email" screen (CreateLoginStep) commonly stays open in
// its own tab while the real click happens in a second tab (or a second
// device that hands off to the same browser) — and localStorage-backed
// auth state is shared across every tab on this origin. The moment the
// magic link is exchanged, AuthContext's own onAuthStateChange listener
// fires in *every* open tab, including that idle first one — which sees
// "authenticated, no profile row yet" and, with nothing to tell it
// otherwise, signs the brand-new session back out from under the second
// tab before the password screen there ever gets submitted (see
// AuthContext's syncSession). A localStorage flag is the only signal that
// reaches every tab: it's what lets that idle tab recognize its own
// in-flight signup and hold off, rather than the in-memory
// signupCompleting flag or a pathname check, which only protect the one
// tab that's actually on /signup/complete.
function markSignupPending(email) {
  localStorage.setItem(SIGNUP_PENDING_KEY, JSON.stringify({ email, stashedAt: Date.now() }))
}

export function isSignupPendingFor(email) {
  const raw = localStorage.getItem(SIGNUP_PENDING_KEY)
  if (!raw) return false
  try {
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.stashedAt > SIGNUP_PENDING_MAX_AGE_MS) return false
    return parsed.email === email
  } catch {
    return false
  }
}

export function clearSignupPending() {
  localStorage.removeItem(SIGNUP_PENDING_KEY)
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
  // getSession() only reads whatever's cached client-side, which can look
  // populated even when the server no longer honors it (e.g. the magic-link
  // token's brief window elapsed while the password form was being filled
  // in). getUser() forces a round trip to Auth to confirm the session is
  // still actually live, so a dead session fails here with a clear message
  // instead of updateUser() throwing the opaque "Auth session missing!".
  //
  // One retry before giving up, mostly as insurance against a plain slow/
  // flaky network round trip — the real cause of this firing shortly after
  // SetPassword's own getUser() just confirmed the session was live is
  // almost always the cross-tab race markSignupPending() now guards
  // against (see onAuthStateChange in AuthContext): a leftover "Check your
  // email" tab reacting to this exact session and signing it out before
  // this call ever runs. Misreporting either case as "your session
  // expired" sends someone through a whole fresh signup link for nothing.
  let userCheck = await supabase.auth.getUser()
  if (userCheck.error || !userCheck.data?.user) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    userCheck = await supabase.auth.getUser()
  }
  if (userCheck.error || !userCheck.data?.user) {
    throw new Error('Your session expired while this was open. Please restart signup to get a fresh link.')
  }

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
  clearSignupPending()

  return { user, answers: pending.answers }
}

const GOOGLE_SIGNUP_KEY = 'onboarding_google_signup'

// Google OAuth is a full-page redirect away and back, so the username +
// wizard answers picked before it (we don't know the user's real email
// until Google returns it) are stashed rather than going through the
// pending_onboarding table, and picked back up on /signup/complete.
// localStorage rather than sessionStorage: a full OAuth round trip can
// take long enough to cross a browser restart (an update relaunch, the
// OS reclaiming a backgrounded tab on mobile, etc.), and sessionStorage
// doesn't survive that — losing the stash mid-flow stranded a real
// Google-authenticated account with no profile.
export function stashGoogleSignup({ username, answers }) {
  localStorage.setItem(GOOGLE_SIGNUP_KEY, JSON.stringify({ username, answers, stashedAt: Date.now() }))
}

const GOOGLE_SIGNUP_MAX_AGE_MS = 30 * 60 * 1000

function readGoogleSignup() {
  const raw = localStorage.getItem(GOOGLE_SIGNUP_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.stashedAt > GOOGLE_SIGNUP_MAX_AGE_MS) return null
    return parsed
  } catch {
    return null
  }
}

function popGoogleSignup() {
  const parsed = readGoogleSignup()
  localStorage.removeItem(GOOGLE_SIGNUP_KEY)
  return parsed
}

// Invalidates a stash from an abandoned "Continue with Google" attempt —
// see startSignup, which calls this the moment someone commits to the email
// path instead.
export function clearGoogleSignupStash() {
  localStorage.removeItem(GOOGLE_SIGNUP_KEY)
}

// Non-destructive check for "did THIS browser just come back from a
// Google signup redirect we initiated". This is the reliable signal for
// routing /signup/complete — session.user.app_metadata.provider is NOT:
// Supabase keeps `provider` pinned to whichever auth method created the
// account first, so someone who tried email signup, never confirmed it
// (see the email rate-limit issue), and then used "Continue with Google"
// gets auto-linked into the *same* user row with `provider` still reading
// 'email' even though this sign-in was 100% Google. The stash is written
// by this app immediately before the redirect, so it's authoritative
// regardless of what Supabase's linking did to the account underneath it.
export function hasGoogleSignupStash() {
  return readGoogleSignup() !== null
}

// Completes a Google-initiated signup for the now-authenticated user.
// Google verifies the email itself, so there's no password to set and no
// pending_onboarding round trip — just create the profile from what was
// stashed before the redirect.
export async function completeGoogleSignup(user) {
  const stashed = popGoogleSignup()
  if (!stashed) return { user, answers: null }

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: user.id, username: stashed.username, tier: stashed.answers?.tier ?? null })
  if (profileError && profileError.code !== '23505') throw profileError

  // Mirror image of the stash problem above: if this same email previously
  // started (but never finished) the email/password path, it left a row in
  // pending_onboarding reserving whatever username was picked there. That
  // path is moot now that Google just completed the signup, and left
  // behind it'd permanently block that username for anyone (pending rows
  // aren't cleaned up by anything else once the account behind them exists).
  if (user.email) {
    await supabase.from('pending_onboarding').delete().eq('email', user.email)
  }

  return { user, answers: stashed.answers }
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
