import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
  EMAIL_PATTERN,
  USERNAME_PATTERN,
  isUsernameAvailable,
  normalizeEmail,
  normalizeUsername,
  sendSignupEmail,
  stashGoogleSignup,
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.12A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.61H1.26a12 12 0 0 0 0 10.78z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.61l4.01 3.12C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </svg>
  )
}

export default function CreateLoginStep({ tier, rhythm, picked, onBack }) {
  const [view, setView] = useState('form') // 'form' | 'checkEmail'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)
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

  async function handleGoogle() {
    setFormError('')

    const normalizedUsername = normalizeUsername(username)
    const usernameFormatError = validateUsernameFormat(normalizedUsername)
    setUsernameError(usernameFormatError)
    if (usernameFormatError) return

    setGoogleSubmitting(true)
    try {
      const available = await isUsernameAvailable(normalizedUsername)
      if (!available) {
        setUsernameError('That username is taken.')
        setGoogleSubmitting(false)
        return
      }

      stashGoogleSignup({ username: normalizedUsername, answers: { tier, rhythm, picked } })

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/signup/complete` },
      })
      if (error) throw error
    } catch (err) {
      setFormError(err.message || 'Could not start Google sign-up. Please try again.')
      setGoogleSubmitting(false)
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
        Sign up with Google, or we&rsquo;ll email you a link to set your password.
      </p>

      <div className="mb-5">
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

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleSubmitting || submitting}
        className="mb-5 flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-cream/[0.16] bg-cream/[0.04] px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-cream disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon />
        {googleSubmitting ? 'Redirecting…' : 'Continue with Google'}
      </button>

      <div className="mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-cream/[0.1]" />
        <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-cream/40">or</span>
        <div className="h-px flex-1 bg-cream/[0.1]" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
            disabled={submitting || googleSubmitting}
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
