import { Link } from 'react-router-dom'
import { roleBadgeLabel } from '../lib/courseAccess'
import { formatPrice } from '../lib/billing'

function LockBadge({ label }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[rgba(10,13,7,0.45)]">
      <div className="flex items-center gap-[7px] rounded-full border border-cream/20 bg-[rgba(10,13,7,0.7)] px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream/85">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        {label}
      </div>
    </div>
  )
}

// One card, reused by Dashboard, CourseLibrary, and Programs (when logged
// in) so all three surfaces show identical lock/progress/enroll states —
// see lib/courseAccess.js for how `access` is computed.
//
// access.reason drives the lock badge text:
//   'wrong_role'   — this course is role-gated and the viewer's role isn't
//                    one of them (shown even with an active membership)
//   'not_entitled' — no membership and no purchase at all
// Both locked reasons can still be unlocked by buying this specific course
// (the one override to the role gate), so both show the same price + Enroll
// button whenever the course has a price set.
export default function CourseCard({ course, access, episodeCount, progressPercent = 0, onEnroll, enrolling, enrollError }) {
  const { unlocked, showProgress, reason } = access
  const completed = showProgress && progressPercent >= 100
  const metaParts = []
  if (course.duration_label) metaParts.push(course.duration_label)
  if (typeof episodeCount === 'number') metaParts.push(`${episodeCount} episode${episodeCount === 1 ? '' : 's'}`)

  // A course open to all three roles isn't really "role-restricted" — the
  // lock (when not unlocked) is purely about payment, so the badge says
  // "Membership" rather than spelling out all three roles pointlessly.
  // 'wrong_role' can only happen when the roles are a strict subset, so it
  // never hits this branch.
  const openToAllRoles = (course.visible_tiers || []).length >= 3
  const lockLabel = openToAllRoles
    ? 'Membership'
    : reason === 'wrong_role'
      ? `${roleBadgeLabel(course.visible_tiers)} only`
      : roleBadgeLabel(course.visible_tiers)
  const canEnroll = !unlocked && course.price_cents > 0 && !!onEnroll

  return (
    <div className="w-[300px] shrink-0">
      <Link to={`/courses/${course.id}`} className="block text-inherit no-underline">
        <div className="relative mb-2.5 aspect-video overflow-hidden rounded-xl border border-cream/[0.09] bg-[rgb(30,36,22)]">
          {course.thumbnail_url && (
            <img
              src={course.thumbnail_url}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover ${
                unlocked ? 'brightness-[0.7]' : 'scale-105 brightness-[0.5] blur-[3px]'
              }`}
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(transparent_40%,rgba(10,13,7,0.85))]" />
          {!unlocked && <LockBadge label={lockLabel} />}
          <div className="absolute bottom-3 left-3.5 right-3.5 text-base font-bold uppercase leading-[1.05] text-white">
            {course.title}
          </div>
        </div>

        {/* Progress lives underneath the card, not as a thin overlay on the
            thumbnail — a lot easier to notice against a busy image. Never
            shown for admin (access.showProgress is always false there). */}
        {showProgress && (
          <div className="mb-1.5 flex items-center gap-2">
            <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-cream/15">
              <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, progressPercent)}%` }} />
            </div>
            <span className="shrink-0 font-sans text-[11px] font-semibold tabular-nums text-gold">
              {completed ? 'Completed ✓' : `${progressPercent}%`}
            </span>
          </div>
        )}

        {metaParts.length > 0 && (
          <div className="text-xs font-semibold tracking-[0.06em] text-cream/55">{metaParts.join(' · ')}</div>
        )}
      </Link>

      {!unlocked && (
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="font-sans text-[15px] font-bold text-white">{formatPrice(course.price_cents)}</span>
          {canEnroll ? (
            <button
              type="button"
              onClick={() => onEnroll(course.id)}
              disabled={enrolling}
              className="cursor-pointer rounded-full border-none bg-gold px-4 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enrolling ? 'Redirecting…' : 'Enroll now'}
            </button>
          ) : (
            <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.06em] text-cream/40">
              Not sold individually
            </span>
          )}
        </div>
      )}
      {enrollError && <p className="mt-1.5 font-serif text-[12px] text-[#D8888A]">{enrollError}</p>}
    </div>
  )
}
