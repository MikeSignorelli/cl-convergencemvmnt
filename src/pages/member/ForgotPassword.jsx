import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { EMAIL_PATTERN, normalizeEmail, checkEmailSignupStatus } from '../../lib/onboardingSignup'
import logo from '../../assets/images/convergence-mvmnt.png'

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-ink font-sans text-cream">
      <header className="flex h-[70px] items-center border-b border-cream/[0.07] px-8">
        <Link to="/" className="block">
          <img src={logo} alt="Convergence MVMNT" className="block h-11 w-auto" />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[440px] px-6 py-16">{children}</main>
    </div>
  )
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const normalized = normalizeEmail(email)
    if (!EMAIL_PATTERN.test(normalized)) {
      setError('Enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      const status = await checkEmailSignupStatus(normalized)
      if (!status.exists) {
        setError('No account found for this email address.')
        setSubmitting(false)
        return
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalized, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <Shell>
        <div className="text-center">
          <div className="mx-auto mb-[22px] flex h-[74px] w-[74px] items-center justify-center rounded-[20px] border border-gold/35 bg-gold/[0.13]">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16v16H4z" />
              <path d="m4 6 8 7 8-7" />
            </svg>
          </div>
          <h1 className="mb-3 text-[28px] font-bold uppercase leading-[1.05] text-white">Check your email</h1>
          <p className="mb-2 font-serif text-base leading-[1.6] text-cream/70">
            We sent a reset link to
          </p>
          <p className="mb-8 font-sans text-lg font-semibold text-gold">{normalizeEmail(email)}</p>
          <p className="mx-auto mb-8 max-w-[380px] font-serif text-sm leading-[1.6] text-cream/55">
            It&rsquo;s valid for 24 hours and can only be used once.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2.5 rounded-full border border-cream/[0.22] px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-cream no-underline"
          >
            Back to login
          </Link>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <h1 className="mb-3 text-[28px] font-bold uppercase leading-[1.05] text-white">Reset your password</h1>
      <p className="mb-8 font-serif text-base leading-[1.6] text-cream/70">
        Enter the email on your account and we&rsquo;ll send you a link to set a new password.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
          />
        </div>

        {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border-none bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-6 text-center font-serif text-[13.5px] text-cream/55">
        <Link to="/login" className="text-gold">Back to login</Link>
      </p>
    </Shell>
  )
}
