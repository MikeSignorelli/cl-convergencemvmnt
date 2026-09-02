import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
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

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError('Incorrect email or password.')
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setGoogleSubmitting(true)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      })
      if (oauthError) throw oauthError
    } catch (err) {
      setError(err.message || 'Could not start Google sign-in. Please try again.')
      setGoogleSubmitting(false)
    }
  }

  return (
    <Shell>
      <h1 className="mb-3 text-[28px] font-bold uppercase leading-[1.05] text-white">Log in</h1>
      <p className="mb-8 font-serif text-base leading-[1.6] text-cream/70">
        Welcome back — sign in to your account.
      </p>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleSubmitting}
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
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
          />
        </div>
        <div>
          <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
          />
        </div>

        {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border-none bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center font-serif text-[13.5px] text-cream/55">
        Not a member yet?{' '}
        <Link to="/onboarding" className="text-gold">
          Join the movement
        </Link>
      </p>
    </Shell>
  )
}
