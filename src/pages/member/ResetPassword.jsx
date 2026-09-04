import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { isCommonPassword } from '../../lib/commonPasswords'
import logo from '../../assets/images/convergence-mvmnt.png'

const MIN_PASSWORD_LENGTH = 12

function getUrlError() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const search = new URLSearchParams(window.location.search)
  return hash.get('error') || search.get('error')
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

export default function ResetPassword() {
  const navigate = useNavigate()
  // 'checking' | 'ready' | 'done' | 'expired'
  const [status, setStatus] = useState('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      if (getUrlError()) {
        if (!cancelled) setStatus('expired')
        return
      }

      // Same pattern as SetPassword.jsx: detectSessionInUrl may already have
      // consumed the recovery token by the time this runs, so check the
      // session directly and give onAuthStateChange a moment rather than
      // assuming getSession() has it synchronously.
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
        setStatus('expired')
        return
      }

      // Confirm the session is genuinely live server-side before showing
      // the form — see AuthContext/SetPassword.jsx for why getSession()
      // alone isn't a reliable enough check.
      const { data: userCheck, error: userCheckError } = await supabase.auth.getUser()
      if (cancelled) return
      if (userCheckError || !userCheck?.user) {
        setStatus('expired')
        return
      }

      setStatus('ready')
    }

    resolve()
    return () => {
      cancelled = true
    }
  }, [])

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
    try {
      const { data: userCheck, error: userCheckError } = await supabase.auth.getUser()
      if (userCheckError || !userCheck?.user) {
        throw new Error('Your reset link expired while this was open. Please request a fresh one.')
      }
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setStatus('done')
      setTimeout(() => navigate('/dashboard', { replace: true }), 1600)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (status === 'checking') {
    return (
      <Shell>
        <StatusMessage title="One moment" body="Checking your link…" />
      </Shell>
    )
  }

  if (status === 'expired') {
    return (
      <Shell>
        <StatusMessage
          title="Link no longer valid"
          body="This reset link has expired or has already been used. Request a fresh one to continue."
        >
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink no-underline"
          >
            Request a new link
          </Link>
        </StatusMessage>
      </Shell>
    )
  }

  if (status === 'done') {
    return (
      <Shell>
        <StatusMessage title="Password updated" body="Taking you to your dashboard…" />
      </Shell>
    )
  }

  return (
    <Shell>
      <h1 className="mb-3 text-[28px] font-bold uppercase leading-[1.05] text-white">Set a new password</h1>
      <p className="mb-8 font-serif text-base leading-[1.6] text-cream/70">
        Choose a new password for your account.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
            New password
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

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border-none bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </Shell>
  )
}
