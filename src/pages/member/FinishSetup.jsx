import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import ProfileStep from './ProfileStep'
import logo from '../../assets/images/convergence-mvmnt.png'

// Recovery destination for someone who paid but dropped off before finishing
// the profile step (the "finish setting up your account" link target — task
// A8). The account + active subscription already exist by this point (the
// Stripe webhook recorded the payment), so this ONLY collects the profile —
// it never re-runs checkout, so there's no way to be charged twice. Reuses
// ProfileStep verbatim so validation + avatar upload behave identically to
// onboarding. Reached in-app via the dashboard nudge, and (once Layer 2 ships)
// via an emailed magic link that lands here.
export default function FinishSetup() {
  const { loading, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  if (loading) return null

  // Already finished — nothing to recover.
  if (profile?.display_name) return <Navigate to="/dashboard" replace />

  async function handleDone() {
    await refreshProfile() // pick up the just-saved display_name so the nudge clears
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-ink font-sans text-cream">
      <header className="flex h-[70px] items-center border-b border-cream/[0.07] px-8">
        <Link to="/dashboard" className="block">
          <img src={logo} alt="Convergence MVMNT" className="block h-11 w-auto" />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[560px] px-6 py-14">
        <div className="mb-7 flex items-center gap-2.5 rounded-cv-lg border border-[rgba(155,192,138,0.3)] bg-[rgba(155,192,138,0.08)] px-5 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9BC08A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
          </svg>
          <span className="font-sans text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#9BC08A]">
            Payment confirmed — just finish your profile, no charge
          </span>
        </div>

        <ProfileStep onBack={() => navigate('/dashboard')} onNext={handleDone} />

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="cursor-pointer border-none bg-transparent font-sans text-[11.5px] font-semibold uppercase tracking-[0.12em] text-cream/45 hover:text-cream/70"
          >
            Finish later — go to dashboard
          </button>
        </div>
      </main>
    </div>
  )
}
