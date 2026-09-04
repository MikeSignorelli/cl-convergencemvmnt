import { useEffect, useRef, useState } from 'react'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { useAuth } from '../../lib/AuthContext'
import { fetchProfile, saveProfile, uploadAvatar, validateAvatarFile } from '../../lib/profile'

export default function AdminProfile() {
  const { session, profile, refreshProfile } = useAuth()
  const fileInputRef = useRef(null)

  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!session?.user?.id) return
      const data = await fetchProfile(session.user.id)
      if (cancelled || !data) return
      setDisplayName(data.display_name || '')
      setCity(data.city || '')
      setBio(data.bio || '')
      setAvatarUrl(data.avatar_url || '')
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [session?.user?.id])

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const validationError = validateAvatarFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    setUploading(true)
    setError('')
    try {
      const url = await uploadAvatar(session.user.id, file)
      setAvatarUrl(url)
    } catch (err) {
      setError(err.message || 'Could not upload photo.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!displayName.trim()) {
      setError('Display name is required.')
      return
    }

    setSaving(true)
    try {
      await saveProfile(session.user.id, { displayName: displayName.trim(), city, bio, avatarUrl })
      await refreshProfile()
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  const initials = (displayName || profile?.username || '—')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/admin/profile" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar />
        <main className="mx-auto w-full max-w-[560px] flex-1 px-8 pb-16 pt-9">
          <h1 className="mb-1 font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">
            Admin profile
          </h1>
          <p className="mb-8 font-serif text-[15px] text-cream/60">
            Your account details, visible to you only.
          </p>

          {loading ? (
            <p className="font-serif text-cream/50">Loading…</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-gold/40 bg-gold/[0.14]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-sans text-xl font-bold text-gold">
                      {initials}
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="cursor-pointer rounded-full border border-cream/[0.18] bg-cream/[0.04] px-5 py-2.5 font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-cream disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploading ? 'Uploading…' : 'Change photo'}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                  Email
                </label>
                <input
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="w-full cursor-not-allowed rounded-[10px] border border-cream/[0.1] bg-cream/[0.02] px-4 py-[13px] font-serif text-[15px] text-cream/50 outline-none"
                />
                <p className="mt-1.5 font-serif text-[12.5px] text-cream/40">
                  Contact another admin directly in Supabase to change your login email.
                </p>
              </div>

              <div>
                <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
                />
              </div>

              <div>
                <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                  City (optional)
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
                />
              </div>

              <div>
                <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                  Bio (optional)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
                />
              </div>

              {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}
              {success && <p className="font-serif text-[13px] text-[#9BC08A]">Saved.</p>}

              <button
                type="submit"
                disabled={saving}
                className="mt-2 flex w-fit cursor-pointer items-center gap-2.5 rounded-full border-none bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  )
}
