// Client-side mirror of can_access_course (migration 0041) — a UX nicety
// only, not the real gate: the actual video/episode RPCs re-check this
// server-side regardless of what this computes. Kept here as the single
// place Dashboard/CourseLibrary/Programs/CourseDetail all call, so the four
// surfaces can't drift into disagreeing lock states.
//
// Reasons, matching the server's:
//   'admin'          — always unlocked, and never shows a progress bar
//   'purchased'      — bought this specific course individually; overrides role
//   'membership'     — active subscription AND profile.tier is in course.visible_tiers
//   'wrong_role'     — active subscription, but course.visible_tiers doesn't include their tier
//   'not_entitled'   — no active subscription and no purchase of this course
export function getCourseAccess({ course, profile, isAdmin, purchasedCourseIds = [] }) {
  if (isAdmin) {
    return { unlocked: true, showProgress: false, reason: 'admin' }
  }

  if (purchasedCourseIds.includes(course.id)) {
    return { unlocked: true, showProgress: true, reason: 'purchased' }
  }

  const hasActiveMembership = profile?.subscription_status === 'active'
  if (hasActiveMembership) {
    const tiers = course.visible_tiers || []
    const roleMatches = !!profile?.tier && tiers.includes(profile.tier)
    if (roleMatches) {
      return { unlocked: true, showProgress: true, reason: 'membership' }
    }
    return { unlocked: false, showProgress: false, reason: 'wrong_role' }
  }

  return { unlocked: false, showProgress: false, reason: 'not_entitled' }
}

// Label for the role-lock badge on a locked-but-visible course card, e.g.
// "Leader" or "Leader & Pastor" for a course assigned to two roles.
const TIER_LABELS = { disciple: 'Disciple', leader: 'Leader', pastor: 'Pastor' }
export function roleBadgeLabel(visibleTiers) {
  const labels = (visibleTiers || []).map((t) => TIER_LABELS[t] || t)
  if (labels.length === 0) return 'Members'
  if (labels.length === 1) return labels[0]
  return `${labels.slice(0, -1).join(', ')} & ${labels[labels.length - 1]}`
}
