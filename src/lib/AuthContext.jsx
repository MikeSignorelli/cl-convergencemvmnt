import { createContext, useContext, useEffect, useRef, useState } from 'react'
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
  const loadedUserId = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function loadProfileFor(nextSession) {
      const userId = nextSession?.user?.id ?? null
      if (!userId) {
        loadedUserId.current = null
        if (!cancelled) setProfile(null)
        return
      }
      // Avoid refetching on every token-refresh event for the same user.
      if (loadedUserId.current === userId) return
      loadedUserId.current = userId
      const p = await fetchProfile(userId)
      if (!cancelled) setProfile(p)
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      setSession(data.session)
      await loadProfileFor(data.session)
      if (!cancelled) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return
      setSession(nextSession)
      if (!nextSession) setPreviewTier(null)
      loadProfileFor(nextSession)
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
