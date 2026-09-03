import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth, beginSignupCompletion, endSignupCompletion } from '../../lib/AuthContext'
import { completeGoogleSignup, completeSignup, hasProfile } from '../../lib/onboardingSignup'
import { seedOnboardingSession, PROFILE_STEP } from './useOnboardingSession'
import { isCommonPassword } from '../../lib/commonPasswords'
import logo from '../../assets/images/convergence-mvmnt.png'

const MIN_PASSWORD_LENGTH = 12

function getUrlError() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const search = new URLSearchParams(window.location.search)
  return hash.get('error') || search.get('error')
}

function hasAuthParams() {
  return window.location.hash.includes('access_token') || window.location.search.includes('code=')
}

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

function StatusMessage({ title, body, children }) {
  return (
    <div className="text-center">
      <h1 className="mb-3 text-[28px] font-bold uppercase leading-[1.05] text-white">{title}</h1>
      <p className="mb-8 font-serif text-base leading-[1.6] text-cream/70">{body}</p>
      {children}
    </div>
  )
}

export default function SetPassword() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  // 'checking' | 'ready' | 'already-member' | 'google-error' | 'expired' | 'invalid'
  const [status, setStatus] = useState('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      const urlError = getUrlError()
      if (urlError) {
        if (!cancelled) setStatus('expired')
        return
      }

      // Don't hard-gate on hasAuthParams() still being in the URL: the
      // Supabase client's own detectSessionInUrl consumes and strips the
      // hash/query token as soon as it initializes, which can (and often
      // does) happen before this effect runs — leaving a real, valid
      // session with no trace of the params that produced it. So always
      // check for a session directly, giving it a moment via
      // onAuthStateChange rather than assuming getSession() already has
      // it synchronously, and only treat it as invalid/expired once that
      // comes up empty.
      const hadAuthParams = hasAuthParams()
      let session = (await supabase.auth.getSession()).data.session
      if (!session) {
        session = await new Promise((resolvePromise) => {
          const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
            if (s) {
              sub.subscription.unsubscribe()
              resolvePromise(s)
            }
          })
          setTimeout(() => {
            sub.subscription.unsubscribe()
            resolvePromise(null)
          }, 5000)
        })
      }

      if (cancelled) return

      if (!session) {
        setStatus(hadAuthParams ? 'expired' : 'invalid')
        return
      }

      // getSession()/onAuthStateChange above only reflect client-cached
      // state, which can resolve with something session-shaped even when
      // the server no longer honors it. getUser() forces a round trip to
      // Auth to confirm it's still actually live before showing the
      // password form — otherwise the user fills it in only to hit a
      // confusing "Auth session missing!" on submit.
      const { data: userCheck, error: userCheckError } = await supabase.auth.getUser()
      if (cancelled) return
      if (userCheckError || !userCheck?.user) {
        setStatus('expired')
        return
      }

      // Someone clicked a sign-in link for an email that's already a full
      // member (see startSignup's comment on why we can't distinguish this
      // case earlier without leaking account existence) — just sign them in.
      const alreadyMember = await hasProfile(session.user.id)
      if (cancelled) return

      if (alreadyMember) {
        setStatus('already-member')
        setTimeout(() => navigate('/dashboard', { replace: true }), 1200)
        return
      }

      // Google verifies the email itself — no password to set. Create the
      // profile from what was stashed before the OAuth redirect and skip
      // straight to the rest of onboarding.
      if (session.user.app_metadata?.provider === 'google') {
        beginSignupCompletion()
        try {
          const { answers } = await completeGoogleSignup(session.user)
          if (cancelled) return
          if (!answers) {
            setStatus('google-error')
            return
          }
          seedOnboardingSession({ step: PROFILE_STEP, ...answers })
          await refreshProfile()
          if (!cancelled) navigate('/onboarding', { replace: true })
        } catch {
          if (!cancelled) setStatus('google-error')
        } finally {
          // refreshProfile() above already gives AuthContext the settled
          // profile before this lock lifts, so there's no gap where it
          // could re-check with stale state and reject the new session.
          endSignupCompletion()
        }
        return
      }

      setStatus('ready')
    }

    resolve()
    return () => {
      cancelled = true
    }
  }, [navigate, refreshProfile])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (isCommonPassword(password)) {
      setError('That password is too common — please choose another.')
      return
    }
    if (password !== confirm) {
      setError('Passwords don’t match.')
      return
    }

    setSubmitting(true)
    beginSignupCompletion()
    try {
      const { answers } = await completeSignup({ password })
      if (answers) {
        seedOnboardingSession({ step: PROFILE_STEP, ...answers })
      }
      await refreshProfile()
      navigate('/onboarding', { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    } finally {
      endSignupCompletion()
    }
  }

  if (status === 'checking') {
    return (
      <Shell>
        <StatusMessage title="One moment" body="Checking your link…" />
      </Shell>
    )
  }

  if (status === 'already-member') {
    return (
      <Shell>
        <StatusMessage
          title="Welcome back"
          body="You already have an account — taking you to your dashboard."
        />
      </Shell>
    )
  }

  if (status === 'google-error') {
    return (
      <Shell>
        <StatusMessage
          title="Something went wrong"
          body="We couldn't finish setting up your account. Please restart signup and try again."
        >
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink no-underline"
          >
            Back to onboarding
          </Link>
        </StatusMessage>
      </Shell>
    )
  }

  if (status === 'expired') {
    return (
      <Shell>
        <StatusMessage
          title="Link no longer valid"
          body="This signup link has expired or has already been used. Start over to get a fresh one."
        >
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink no-underline"
          >
            Back to onboarding
          </Link>
        </StatusMessage>
      </Shell>
    )
  }

  if (status === 'invalid') {
    return (
      <Shell>
        <StatusMessage
          title="Not a valid signup link"
          body="This link doesn’t look right. If you meant to finish signing up, start from the onboarding flow again."
        >
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink no-underline"
          >
            Back to onboarding
          </Link>
        </StatusMessage>
      </Shell>
    )
  }

  return (
    <Shell>
      <h1 className="mb-3 text-[28px] font-bold uppercase leading-[1.05] text-white">
        Set a password
      </h1>
      <p className="mb-8 font-serif text-base leading-[1.6] text-cream/70">
        Last step before your profile — choose a password for your account.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
          />
        </div>
        <div>
          <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
            Confirm password
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

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border-none bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Setting password…' : 'Set password & continue'}
        </button>
      </form>
    </Shell>
  )
}
