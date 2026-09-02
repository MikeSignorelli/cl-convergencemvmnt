import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext(null)

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, tier, avatar_url')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
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
      if (!cancelled) setProfile(p)
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

  const value = { loading, session, profile, isAdmin, previewTier, setPreviewTier }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
