import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { fetchProfile, saveProfile, uploadAvatar, validateAvatarFile } from '../../lib/profile'

export default function ProfileStep({ onBack, onNext }) {
  const fileInputRef = useRef(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('') // saved (or just-uploaded) URL
  const [avatarPreview, setAvatarPreview] = useState('') // local object URL for an unsaved selection
  const [avatarFile, setAvatarFile] = useState(null)
  const [displayNameError, setDisplayNameError] = useState('')
  const [avatarError, setAvatarError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user?.id
      if (!uid || cancelled) return
      setUserId(uid)
      const existing = await fetchProfile(uid)
      if (cancelled) return
      if (existing) {
        setDisplayName(existing.display_name || '')
        setCity(existing.city || '')
        setBio(existing.bio || '')
        setAvatarUrl(existing.avatar_url || '')
      }
      setLoading(false)
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
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const trimmedName = displayName.trim()
    if (!trimmedName) {
      setDisplayNameError('Enter a display name.')
      return
    }
    setDisplayNameError('')

    setSaving(true)
    try {
      let finalAvatarUrl = avatarUrl
      if (avatarFile && userId) {
        finalAvatarUrl = await uploadAvatar(userId, avatarFile)
      }
      await saveProfile(userId, {
        displayName: trimmedName,
        city: city.trim(),
        bio: bio.trim(),
        avatarUrl: finalAvatarUrl,
      })
      onNext()
    } catch (err) {
      setFormError(err.message || 'Could not save your profile. Please try again.')
      setSaving(false)
    }
  }

  const photoSrc = avatarPreview || avatarUrl

  return (
    <div>
      <h1 className="mb-3 text-[34px] font-bold uppercase leading-[1.02] text-white">
        Set up your profile
      </h1>
      <p className="mb-[30px] font-serif text-[16.5px] leading-[1.6] text-cream/72">
        This is how the community sees you.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
        <div className="mb-2.5 flex items-center gap-[18px]">
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-gold/50 bg-gold/[0.14] text-gold">
            {photoSrc ? (
              <img src={photoSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="cursor-pointer rounded-full border border-cream/[0.22] bg-transparent px-5 py-[10px] font-sans text-[11.5px] font-semibold uppercase tracking-[0.12em] text-cream disabled:cursor-not-allowed disabled:opacity-50"
            >
              {photoSrc ? 'Change photo' : 'Upload photo'}
            </button>
            {avatarError && (
              <p className="mt-1.5 font-serif text-[13px] text-[#D8888A]">{avatarError}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
            Display name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value)
              if (displayNameError) setDisplayNameError('')
            }}
            placeholder="Sarah Mitchell"
            disabled={loading}
            className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none disabled:opacity-50"
          />
          {displayNameError && (
            <p className="mt-1.5 font-serif text-[13px] text-[#D8888A]">{displayNameError}</p>
          )}
        </div>
        <div>
          <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
            City (optional)
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Long Island, NY"
            disabled={loading}
            className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
            One line about you (optional)
          </label>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Breaking patterns, building legacy."
            disabled={loading}
            className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none disabled:opacity-50"
          />
        </div>

        {formError && <p className="font-serif text-[13px] text-[#D8888A]">{formError}</p>}

        <div className="mt-[24px] flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex cursor-pointer items-center gap-2 border-none bg-transparent font-sans text-xs font-semibold uppercase tracking-[0.12em] text-cream/55"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </button>
          <button
            type="submit"
            disabled={saving || loading}
            className="flex cursor-pointer items-center gap-2.5 rounded-full border-none bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Continue'}
            {!saving && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
