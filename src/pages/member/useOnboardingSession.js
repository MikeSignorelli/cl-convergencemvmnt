import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

// Single source of truth for onboarding entry/skip/persistence logic.
// Keeping it here (instead of inline in the page or scattered across steps)
// so the "arrive from a landing page -> skip to step 2" behavior has one place to read/change.

const STORAGE_KEY = 'cv-onboarding-session'
export const VALID_TIERS = ['disciple', 'leader', 'pastor']
export const TOTAL_STEPS = 5
// "Create your login" (3) and everything after it requires having actually been
// through that step — reaching "Set up your profile" (4) or later without a
// real Supabase session means someone jumped ahead (stale storage, manual nav,
// etc.), so we clamp back to 3 rather than showing a step that assumes auth.
export const LOGIN_STEP = 3
export const PROFILE_STEP = 4

const DEFAULTS = {
  step: 1,
  tier: 'disciple',
  rhythm: 'morning',
  picked: ['Breaking generational patterns', 'Healing from my past'],
}

function readPersisted() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed.step !== 'number' || !VALID_TIERS.includes(parsed.tier)) return null
    return parsed
  } catch {
    return null
  }
}

function writePersisted(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — state still works in-memory for this render.
  }
}

// Used by the "set a password" screen (a different page, possibly a different
// device/browser) to hand the restored answers back to the wizard right before
// navigating to /onboarding, so it resumes at "Set up your profile" already filled in.
export function seedOnboardingSession({ step, tier, rhythm, picked }) {
  writePersisted({ step, tier, rhythm, picked })
}

// A valid ?tier= param always means "fresh arrival from a landing page": it wins over
// any persisted mid-flow progress, since clicking a landing-page CTA is a new, explicit choice.
// There's no dedicated "confirm your path" step anymore — the tier is set from this param
// (or DEFAULTS.tier when absent) and carried through silently to signup.
function resolveInitialState(tierParam) {
  if (tierParam && VALID_TIERS.includes(tierParam)) {
    return { step: 1, tier: tierParam, rhythm: DEFAULTS.rhythm, picked: DEFAULTS.picked }
  }
  return readPersisted() ?? { ...DEFAULTS }
}

export function useOnboardingSession() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tierParam = searchParams.get('tier')
  const paramWasValid = VALID_TIERS.includes(tierParam)

  // Resolve once, synchronously, on first render — before paint, so there's no step-1 flash.
  const initial = useRef(null)
  if (initial.current === null) {
    initial.current = resolveInitialState(tierParam)
  }

  const [step, setStep] = useState(initial.current.step)
  const [tier, setTier] = useState(initial.current.tier)
  const [rhythm, setRhythm] = useState(initial.current.rhythm)
  const [picked, setPicked] = useState(initial.current.picked)

  // Strip the query param once consumed (replaceState, not a new history entry) so a later
  // refresh resumes from sessionStorage instead of re-forcing step 2 / discarding progress.
  useEffect(() => {
    if (paramWasValid) {
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Guard: someone landing on the profile step (or later) without ever having
  // authenticated via "Create your login" gets sent back to that step instead
  // of seeing a broken/empty profile screen.
  useEffect(() => {
    if (step < PROFILE_STEP) return
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && !data.session) setStep(LOGIN_STEP)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist every change so refreshing mid-flow keeps the user's place.
  useEffect(() => {
    writePersisted({ step, tier, rhythm, picked })
  }, [step, tier, rhythm, picked])

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1))
  const back = () => setStep((s) => Math.max(1, s - 1))
  const togglePicked = (option) => {
    setPicked((prev) =>
      prev.includes(option) ? prev.filter((p) => p !== option) : [...prev, option]
    )
  }

  return { step, tier, setTier, rhythm, setRhythm, picked, togglePicked, next, back, setStep }
}
