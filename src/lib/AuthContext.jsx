import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { isSignupPendingFor } from './onboardingSignup'

const AuthContext = createContext(null)

// Signup completion (magic-link password submit, or the Google branch on
// /signup/complete) creates the profiles row itself, in a window that spans
// a client-side route change to /onboarding once it succeeds. A plain
// pathname check doesn't cover that: this effect's own profile fetch can
// still be in flight from before the navigation and resolve after it,
// finding "no profile yet" and signing the freshly-created account back out
// from under it. An in-memory flag (survives the client-side route change,
// since nothing here triggers a real page reload) closes that race —
// SetPassword sets it for the whole time it's creating the profile.
let signupCompleting = false
export function beginSignupCompletion() {
  signupCompleting = true
}
export function endSignupCompletion() {
  signupCompleting = false
}

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, tier, avatar_url, subscription_status')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authError, setAuthError] = useState('')
  // Admin's "view this tier's dashboard read-only" state. Intentionally
  // in-memory only (not sessionStorage) so it never persists across a
  // refresh and can't be mistaken for the admin's real identity.
  const [previewTier, setPreviewTier] = useState(null)

  useEffect(() => {
    let cancelled = false

    // Single entry point for applying a session: always awaits the profile
    // fetch to completion before any caller can treat state as settled.
    // supabase-js fires onAuthStateChange's INITIAL_SESSION event around
    // the same time getSession() resolves — both call this, so `loading`
    // must not flip to false until whichever call is currently in flight
    // for the CURRENT user has actually finished, or isAdmin can briefly
    // read false (profile still null) and trip an adminOnly redirect.
    async function syncSession(nextSession) {
      setSession(nextSession)
      const userId = nextSession?.user?.id ?? null
      if (!userId) {
        if (!cancelled) setProfile(null)
        return
      }
      const p = await fetchProfile(userId)
      if (cancelled) return
      if (!p) {
        // Signup (magic-link or Google) creates the profiles row itself —
        // don't yank the session out from under it while that's in
        // progress. Pathname and signupCompleting only protect the ONE tab
        // actually doing the signup, though: the "Check your email" screen
        // routinely stays open in a first tab while the real magic-link
        // click happens in a second one, and localStorage-backed auth state
        // is shared across every tab on this origin — the instant that
        // second tab's session exists, THIS effect fires here too, in the
        // idle first tab, which has neither of those two signals set.
        // Without a signal that reaches every tab, that idle tab would
        // reject its own signup as invalid and sign it out from under the
        // second tab before the password screen there ever gets submitted
        // (see markSignupPending / isSignupPendingFor in onboardingSignup.js,
        // the same shape as the Google stash below).
        if (
          signupCompleting ||
          window.location.pathname === '/signup/complete' ||
          isSignupPendingFor(nextSession.user.email)
        ) {
          setProfile(null)
          return
        }
        // Otherwise: authenticated (e.g. via Google) but no matching
        // profiles row — this app only grants access to members who
        // already have an account, so reject the session rather than
        // leaving them signed in with a blank profile.
        //
        // scope: 'local' matters here — the default ('global') revokes
        // every session the user has server-side, not just this tab's. A
        // real incident: someone mid-signup (a valid, in-progress session
        // on /signup/complete deciding a password) separately tried
        // Google from /login out of confusion. That second, profile-less
        // session got rejected here as it should — but a global signOut
        // also killed the refresh token behind their legitimate signup
        // session, so it collapsed the moment they finally submitted,
        // surfacing as "Auth session missing!" with no fault of its own.
        setProfile(null)
        setSession(null)
        setAuthError("This email isn't registered as a member. Please contact us, or join the movement to get access.")
        await supabase.auth.signOut({ scope: 'local' })
        return
      }
      setProfile(p)
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      syncSession(data.session).then(() => {
        if (!cancelled) setLoading(false)
      })
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return
      if (!nextSession) setPreviewTier(null)
      syncSession(nextSession)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const isAdmin = profile?.tier === 'admin'

  // Stable references (useCallback with no deps): both are read via a
  // component effect's dependency array (SetPassword's post-signup resolve,
  // Login's authError pickup) — a new function identity on every
  // AuthProvider render would re-trigger those effects on every unrelated
  // state change here (session/profile settling, etc.), not just once.
  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user?.id
    if (!userId) return
    setProfile(await fetchProfile(userId))
  }, [])

  const clearAuthError = useCallback(() => setAuthError(''), [])

  const signOut = useCallback(async () => {
    setPreviewTier(null)
    await supabase.auth.signOut()
  }, [])

  const value = {
    loading,
    session,
    profile,
    isAdmin,
    previewTier,
    setPreviewTier,
    authError,
    clearAuthError,
    refreshProfile,
    signOut,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
