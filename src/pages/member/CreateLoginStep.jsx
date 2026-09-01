import { useEffect, useState } from 'react'
import {
  EMAIL_PATTERN,
  USERNAME_PATTERN,
  isUsernameAvailable,
  normalizeEmail,
  normalizeUsername,
  sendSignupEmail,
  startSignup,
} from '../../lib/onboardingSignup'

const RESEND_COOLDOWN_SECONDS = 60

function validateUsernameFormat(value) {
  if (!value) return 'Choose a username.'
  if (!USERNAME_PATTERN.test(value)) {
    return '3–20 characters: lowercase letters, numbers, underscore — starting with a letter.'
  }
  return ''
}

function validateEmailFormat(value) {
  if (!value) return 'Enter your email.'
  if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email address.'
  return ''
}

export default function CreateLoginStep({ tier, rhythm, picked, onBack }) {
  const [view, setView] = useState('form') // 'form' | 'checkEmail'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const normalizedUsername = normalizeUsername(username)
    const normalizedEmail = normalizeEmail(email)

    const usernameFormatError = validateUsernameFormat(normalizedUsername)
    const emailFormatError = validateEmailFormat(normalizedEmail)
    setUsernameError(usernameFormatError)
    setEmailError(emailFormatError)
    if (usernameFormatError || emailFormatError) return

    setSubmitting(true)
    try {
      const available = await isUsernameAvailable(normalizedUsername)
      if (!available) {
        setUsernameError('That username is taken.')
        setSubmitting(false)
        return
      }

      await startSignup({
        username: normalizedUsername,
        email: normalizedEmail,
        answers: { tier, rhythm, picked },
      })

      setSentTo(normalizedEmail)
      setView('checkEmail')
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || resending) return
    setResending(true)
    setFormError('')
    try {
      await sendSignupEmail(sentTo)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      setFormError(err.message || 'Could not resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  if (view === 'checkEmail') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-[22px] flex h-[74px] w-[74px] items-center justify-center rounded-[20px] border border-gold/35 bg-gold/[0.13]">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16v16H4z" />
            <path d="m4 6 8 7 8-7" />
          </svg>
        </div>
        <h1 className="mb-3 text-[34px] font-bold uppercase leading-[1.02] text-white">
          Check your email
        </h1>
        <p className="mx-auto mb-[10px] max-w-[420px] font-serif text-[16.5px] leading-[1.6] text-cream/72">
          We sent a signup link to
        </p>
        <p className="mb-[30px] font-sans text-lg font-semibold text-gold">{sentTo}</p>
        <p className="mx-auto mb-8 max-w-[420px] font-serif text-sm leading-[1.6] text-cream/55">
          Click the link to set a password and continue — it expires in 24 hours, and you can
          open it on any device, not just this one.
        </p>

        {formError && <p className="mb-4 font-serif text-sm text-[#D8888A]">{formError}</p>}

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          className="cursor-pointer rounded-full border border-cream/[0.22] bg-transparent px-6 py-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-cream disabled:cursor-not-allowed disabled:opacity-40"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resending ? 'Resending…' : 'Resend email'}
        </button>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setView('form')}
            className="cursor-pointer border-none bg-transparent font-sans text-xs font-semibold uppercase tracking-[0.12em] text-cream/50 underline"
          >
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-3 text-[34px] font-bold uppercase leading-[1.02] text-white">
        Create your login
      </h1>
      <p className="mb-[30px] font-serif text-[16.5px] leading-[1.6] text-cream/72">
        We&rsquo;ll email you a link to set your password.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              if (usernameError) setUsernameError('')
            }}
            onBlur={() => setUsernameError(validateUsernameFormat(normalizeUsername(username)))}
            placeholder="sarahm"
            autoComplete="username"
            className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
          />
          {usernameError && (
            <p className="mt-1.5 font-serif text-[13px] text-[#D8888A]">{usernameError}</p>
          )}
        </div>

        <div>
          <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (emailError) setEmailError('')
            }}
            onBlur={() => setEmailError(validateEmailFormat(normalizeEmail(email)))}
            placeholder="sarah@example.com"
            autoComplete="email"
            className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
          />
          {emailError && <p className="mt-1.5 font-serif text-[13px] text-[#D8888A]">{emailError}</p>}
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
            disabled={submitting}
            className="flex cursor-pointer items-center gap-2.5 rounded-full border-none bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Continue'}
            {!submitting && (
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
