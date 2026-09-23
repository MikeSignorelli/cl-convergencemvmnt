import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

// Single source of truth for onboarding entry/skip/persistence logic.
// Keeping it here (instead of inline in the page or scattered across steps)
// so the "arrive from a landing page -> skip to step 2" behavior has one place to read/change.

const STORAGE_KEY = 'cv-onboarding-session'
export const VALID_TIERS = ['disciple', 'leader', 'pastor']
export const VALID_MODES = ['membership', 'course']
export const TOTAL_STEPS = 6
// "Create your login" (3) and everything after it requires having actually been
// through that step — reaching "Payment" (4) or later without a real Supabase
// session means someone jumped ahead (stale storage, manual nav, etc.), so we
// clamp back to 3 rather than showing a step that assumes auth. Payment itself
// gates "Set up your profile" (5): the account already exists once you reach
// step 4, but the membership isn't paid for yet until Stripe confirms it.
export const LOGIN_STEP = 3
export const PAYMENT_STEP = 4
export const PROFILE_STEP = 5

// Same problem stashGoogleSignup (onboardingSignup.js) already solved once:
// a full-page Google OAuth round trip can outlive a backgrounded mobile tab,
// and sessionStorage doesn't survive that. localStorage + an expiry does —
// the TTL keeps a days-old abandoned session from resurfacing later.
const MAX_AGE_MS = 30 * 60 * 1000

const DEFAULTS = {
  step: 1,
  tier: 'disciple',
  rhythm: 'morning',
  picked: ['Breaking generational patterns', 'Healing from my past'],
  mode: 'membership',
  courseId: null,
}

function readPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > MAX_AGE_MS) return null
    if (typeof parsed.step !== 'number' || !VALID_TIERS.includes(parsed.tier)) return null
    if (parsed.mode === 'course' && !parsed.courseId) return null
    return parsed
  } catch {
    return null
  }
}

function writePersisted(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }))
  } catch {
    // localStorage unavailable (private browsing, etc.) — state still works in-memory for this render.
  }
}

// Used by the "set a password" screen (a different page, possibly a different
// device/browser) to hand the restored answers back to the wizard right before
// navigating to /onboarding, so it resumes at "Set up your profile" already filled in.
// Widened to carry mode/courseId through too — SetPassword.jsx spreads
// `...answers` (from pending_onboarding.answers or the Google stash) into this
// call, so a course-mode signup needs every field it might contain picked up
// here, not just the original four, or it silently reverts to membership mode.
export function seedOnboardingSession({ step, tier, rhythm, picked, mode, courseId }) {
  writePersisted({
    step,
    tier,
    rhythm,
    picked,
    mode: VALID_MODES.includes(mode) ? mode : 'membership',
    courseId: mode === 'course' ? courseId || null : null,
  })
}

// A valid ?tier= param always means "fresh arrival from a landing page": it wins over
// any persisted mid-flow progress, since clicking a landing-page CTA is a new, explicit choice.
// A valid ?course= param means the same thing for a single-course purchase (narrower,
// more specific intent — wins if somehow both are present). Either arrival explicitly
// resets the OTHER mode's fields, so an abandoned course purchase can never leak its
// courseId into a real membership signup reached later via a plain "Join the Movement" link
// (and vice versa) — both routes are reachable from the same nav on the same pages.
function resolveInitialState(tierParam, courseParam) {
  if (courseParam) {
    return { step: 1, tier: DEFAULTS.tier, rhythm: DEFAULTS.rhythm, picked: DEFAULTS.picked, mode: 'course', courseId: courseParam }
  }
  if (tierParam && VALID_TIERS.includes(tierParam)) {
    return { step: 1, tier: tierParam, rhythm: DEFAULTS.rhythm, picked: DEFAULTS.picked, mode: 'membership', courseId: null }
  }
  return readPersisted() ?? { ...DEFAULTS }
}

export function useOnboardingSession() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tierParam = searchParams.get('tier')
  const courseParam = searchParams.get('course')
  const paramWasValid = !!courseParam || VALID_TIERS.includes(tierParam)

  // Resolve once, synchronously, on first render — before paint, so there's no step-1 flash.
  const initial = useRef(null)
  if (initial.current === null) {
    initial.current = resolveInitialState(tierParam, courseParam)
  }

  const [step, setStep] = useState(initial.current.step)
  const [tier, setTier] = useState(initial.current.tier)
  const [rhythm, setRhythm] = useState(initial.current.rhythm)
  const [picked, setPicked] = useState(initial.current.picked)
  const [mode] = useState(initial.current.mode)
  const [courseId] = useState(initial.current.courseId)

  // Strip the query param once consumed (replaceState, not a new history entry) so a later
  // refresh resumes from persisted storage instead of re-forcing step 1 / discarding progress.
  useEffect(() => {
    if (paramWasValid) {
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Two mirrored guards, both reacting to "does a real session already exist":
  //  - step >= PAYMENT_STEP with NO session means someone jumped ahead (stale
  //    storage, manual nav) — clamp back to LOGIN_STEP, already existed.
  //  - step === LOGIN_STEP WITH a session means they just came back from
  //    authenticating (password login redirect, or a Google OAuth full-page
  //    round trip landing directly back on /onboarding — see Login.jsx's
  //    `next` param) — advance straight to PAYMENT_STEP instead of showing
  //    "Create your login" to someone who already has an account.
  // getSession() alone can race the Google-redirect case: Supabase's own
  // detectSessionInUrl may not have finished parsing the return URL yet, so
  // a single check can come back empty and (with no re-check, empty deps)
  // never recover. Same fix SetPassword.jsx already uses for this exact
  // race: fall back to a short onAuthStateChange wait before giving up.
  useEffect(() => {
    if (step < LOGIN_STEP) return
    let cancelled = false

    async function resolveSession() {
      let session = (await supabase.auth.getSession()).data.session
      if (!session && step === LOGIN_STEP) {
        session = await new Promise((resolve) => {
          const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
            if (s) {
              sub.subscription.unsubscribe()
              resolve(s)
            }
          })
          setTimeout(() => {
            sub.subscription.unsubscribe()
            resolve(null)
          }, 5000)
        })
      }
      if (cancelled) return

      if (!session && step >= PAYMENT_STEP) {
        setStep(LOGIN_STEP)
      } else if (session && step === LOGIN_STEP) {
        setStep(PAYMENT_STEP)
      }
    }

    resolveSession()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist every change so refreshing mid-flow keeps the user's place.
  useEffect(() => {
    writePersisted({ step, tier, rhythm, picked, mode, courseId })
  }, [step, tier, rhythm, picked, mode, courseId])

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1))
  const back = () => setStep((s) => Math.max(1, s - 1))
  const togglePicked = (option) => {
    setPicked((prev) =>
      prev.includes(option) ? prev.filter((p) => p !== option) : [...prev, option]
    )
  }

  return { step, tier, setTier, rhythm, setRhythm, picked, togglePicked, mode, courseId, next, back, setStep }
}
