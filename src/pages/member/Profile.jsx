import { useEffect, useRef, useState } from 'react'
import MemberSidebar from '../../components/MemberSidebar'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { fetchProfile, saveProfile, uploadAvatar, validateAvatarFile } from '../../lib/profile'
import { isCommonPassword } from '../../lib/commonPasswords'

const MIN_PASSWORD_LENGTH = 12

const inputClass =
  'w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none focus:border-gold/50'
const labelClass = 'mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50'

function initialsOf(name) {
  if (!name) return ''
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0].toUpperCase()).join('')
}

export default function Profile() {
  const { session, profile: authProfile, refreshProfile } = useAuth()
  const userId = session?.user?.id

  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [hasEmailLogin, setHasEmailLogin] = useState(true)

  // Profile form
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('') // local object URL for an unsaved pick
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarError, setAvatarError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      // getUser() (not session.user) so identities/email are reliably present.
      const { data: u } = await supabase.auth.getUser()
      const user = u?.user
      if (!user || cancelled) {
        if (!cancelled) setLoading(false)
        return
      }
      setEmail(user.email || '')
      const identities = user.identities || []
      // An 'email' identity means a password can be verified/changed; a
      // Google-only account has none yet, so it can only *set* a first one.
      setHasEmailLogin(identities.some((i) => i.provider === 'email'))

      try {
        const existing = await fetchProfile(user.id)
        if (cancelled) return
        if (existing) {
          setDisplayName(existing.display_name || '')
          setCity(existing.city || '')
          setBio(existing.bio || '')
          setAvatarUrl(existing.avatar_url || '')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const validationError = validateAvatarFile(file)
    if (validationError) {
      setAvatarError(validationError)
      return
    }
    setAvatarError('')
    setAvatarFile(file)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(URL.createObjectURL(file))
    setProfileSaved(false)
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setProfileError('')
    setProfileSaved(false)

    const name = displayName.trim()
    if (!name) {
      setProfileError('Enter a display name.')
      return
    }

    setSavingProfile(true)
    try {
      let finalAvatarUrl = avatarUrl
      if (avatarFile && userId) finalAvatarUrl = await uploadAvatar(userId, avatarFile)
      await saveProfile(userId, {
        displayName: name,
        city: city.trim(),
        bio: bio.trim(),
        avatarUrl: finalAvatarUrl,
      })
      setAvatarUrl(finalAvatarUrl)
      setAvatarFile(null)
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
        setAvatarPreview('')
      }
      await refreshProfile() // update the sidebar/topbar avatar + name live
      setProfileSaved(true)
    } catch (err) {
      setProfileError(err.message || 'Could not save your profile. Please try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSavePassword(e) {
    e.preventDefault()
    setPwError('')
    setPwSaved(false)

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPwError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (isCommonPassword(newPassword)) {
      setPwError('That password is too common — please choose another.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords don’t match.')
      return
    }
    if (hasEmailLogin && !currentPassword) {
      setPwError('Enter your current password.')
      return
    }

    setSavingPw(true)
    try {
      // For email/password accounts, verify the current password by
      // re-authenticating before changing it — so an unattended logged-in
      // session can't set a new password without knowing the old one.
      if (hasEmailLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        })
        if (signInError) throw new Error('Current password is incorrect.')
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setHasEmailLogin(true) // a Google-only account now has an email password too
      setPwSaved(true)
    } catch (err) {
      setPwError(err.message || 'Could not update your password. Please try again.')
    } finally {
      setSavingPw(false)
    }
  }

  const photoSrc = avatarPreview || avatarUrl
  const initials = initialsOf(displayName || authProfile?.display_name || authProfile?.username)
  const tierLabel = authProfile?.tier ? authProfile.tier[0].toUpperCase() + authProfile.tier.slice(1) : ''

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/profile" />

      <main className="mx-auto max-w-[760px] flex-1 min-w-0 px-8 py-9 pb-16">
        <h1 className="m-0 text-[32px] font-bold uppercase leading-[1.04] text-white">Profile</h1>
        <p className="mb-8 mt-1.5 font-serif text-[15px] text-cream/60">
          Manage how you show up in the community, and your account security.
        </p>

        {/* Profile details */}
        <form
          onSubmit={handleSaveProfile}
          className="mb-7 rounded-2xl border border-cream/[0.09] bg-[rgb(30,36,22)] p-6 sm:p-7"
          noValidate
        >
          <h2 className="mb-5 text-[13px] font-bold uppercase tracking-[0.14em] text-cream/45">Your profile</h2>

          <div className="mb-6 flex items-center gap-5">
            <div className="relative h-[96px] w-[96px] shrink-0">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-cream/[0.12] bg-gold/[0.14] text-[26px] font-bold text-gold">
                {photoSrc ? (
                  <img src={photoSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials || (
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || savingProfile}
                title="Change photo"
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-[rgb(30,36,22)] bg-gold text-ink hover:bg-[#d4b877] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[16px] font-semibold text-white">{displayName || '—'}</span>
                {tierLabel && (
                  <span className="rounded-full bg-gold/[0.14] px-2.5 py-0.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-gold">
                    {tierLabel}
                  </span>
                )}
              </div>
              <div className="mt-1 overflow-hidden text-ellipsis font-serif text-[13.5px] text-cream/55">{email}</div>
              <div className="mt-2 font-sans text-[11.5px] tracking-[0.02em] text-cream/40">
                JPG, PNG, WEBP, or GIF · up to 5MB
              </div>
              {avatarError && <p className="mt-1.5 font-serif text-[13px] text-[#D8888A]">{avatarError}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  setProfileSaved(false)
                  if (profileError) setProfileError('')
                }}
                placeholder="Sarah Mitchell"
                disabled={loading}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>City (optional)</label>
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value)
                  setProfileSaved(false)
                }}
                placeholder="Long Island, NY"
                disabled={loading}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>One line about you (optional)</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value)
                  setProfileSaved(false)
                }}
                placeholder="Breaking patterns, building legacy."
                disabled={loading}
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              type="submit"
              disabled={savingProfile || loading}
              className="cursor-pointer rounded-full border-none bg-gold px-7 py-3 font-sans text-[12.5px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
            {profileSaved && <span className="font-serif text-[13.5px] text-[#9BC08A]">Profile updated.</span>}
            {profileError && <span className="font-serif text-[13.5px] text-[#D8888A]">{profileError}</span>}
          </div>
        </form>

        {/* Password */}
        <form
          onSubmit={handleSavePassword}
          className="rounded-2xl border border-cream/[0.09] bg-[rgb(30,36,22)] p-6 sm:p-7"
          noValidate
        >
          <h2 className="mb-1.5 text-[13px] font-bold uppercase tracking-[0.14em] text-cream/45">
            {hasEmailLogin ? 'Change password' : 'Set a password'}
          </h2>
          <p className="mb-5 font-serif text-[13.5px] leading-[1.55] text-cream/55">
            {hasEmailLogin
              ? 'Choose a new password for signing in to your account.'
              : 'You currently sign in with Google. Set a password to also sign in with your email.'}
          </p>

          <div className="flex max-w-[420px] flex-col gap-4">
            {hasEmailLogin && (
              <div>
                <label className={labelClass}>Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    if (pwError) setPwError('')
                  }}
                  autoComplete="current-password"
                  className={inputClass}
                />
              </div>
            )}
            <div>
              <label className={labelClass}>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setPwSaved(false)
                  if (pwError) setPwError('')
                }}
                autoComplete="new-password"
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (pwError) setPwError('')
                }}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              type="submit"
              disabled={savingPw || loading}
              className="cursor-pointer rounded-full border-none bg-gold px-7 py-3 font-sans text-[12.5px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPw ? 'Updating…' : hasEmailLogin ? 'Update password' : 'Set password'}
            </button>
            {pwSaved && <span className="font-serif text-[13.5px] text-[#9BC08A]">Password updated.</span>}
            {pwError && <span className="font-serif text-[13.5px] text-[#D8888A]">{pwError}</span>}
          </div>
        </form>
      </main>
    </div>
  )
}
