import { useState } from 'react'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { isCommonPassword } from '../../lib/commonPasswords'

const MIN_PASSWORD_LENGTH = 12

export default function ChangePassword() {
  const { session } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!currentPassword) {
      setError('Enter your current password.')
      return
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (isCommonPassword(newPassword)) {
      setError('That password is too common — please choose another.')
      return
    }
    if (newPassword !== confirm) {
      setError('New passwords don’t match.')
      return
    }

    setSubmitting(true)
    try {
      // Supabase has no direct "verify current password" call — the
      // standard way is to re-authenticate with it. A wrong current
      // password fails here with an auth error before anything changes.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: session?.user?.email,
        password: currentPassword,
      })
      if (verifyError) {
        setError('Current password is incorrect.')
        setSubmitting(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/account/password" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar />
        <main className="mx-auto w-full max-w-[520px] flex-1 px-8 pb-16 pt-9">
          <h1 className="mb-1 font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">
            Change password
          </h1>
          <p className="mb-8 font-serif text-[15px] text-cream/60">
            Update the password for {session?.user?.email}.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
              <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
              />
            </div>
            <div>
              <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
              />
            </div>
            <div>
              <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
              />
            </div>

            {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}
            {success && <p className="font-serif text-[13px] text-[#9BC08A]">Password updated successfully.</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-fit cursor-pointer items-center justify-center gap-2.5 rounded-full border-none bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </main>
      </div>
    </div>
  )
}
