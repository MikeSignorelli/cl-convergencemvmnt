import { useState } from 'react'
import MemberSidebar from '../../components/MemberSidebar'

const BADGES = [
  { name: 'First Steps', desc: 'Completed your first episode', earned: true },
  { name: 'Week One Warrior', desc: '7-day streak', earned: true },
  { name: 'Community Champion', desc: '10 posts or replies', earned: true },
  { name: 'Prayer Warrior', desc: '30 daily resets', earned: true },
  { name: 'Freedom Builder', desc: '14-day streak — 2 days away', earned: false },
  { name: 'Legacy Builder', desc: 'Complete a full course', earned: false },
]

const LEADERS = [
  { rank: 1, initials: 'DR', name: 'David Richardson', role: 'Leader', points: 820, avatarClass: 'bg-[rgba(143,169,189,0.16)] text-[rgb(143,169,189)]', roleClass: 'text-[rgb(143,169,189)]', isMe: false },
  { rank: 2, initials: 'KL', name: 'Kayla Lewis', role: 'Disciple', points: 760, avatarClass: 'bg-gold/[0.14] text-gold', roleClass: 'text-gold', isMe: false },
  { rank: 3, initials: 'JT', name: 'Pastor James Thompson', role: 'Pastor', points: 705, avatarClass: 'bg-[rgba(180,115,123,0.16)] text-[rgb(180,115,123)]', roleClass: 'text-[rgb(180,115,123)]', isMe: false },
  { rank: 4, initials: 'MR', name: 'Marcus Reid', role: 'Disciple', points: 640, avatarClass: 'bg-gold/[0.14] text-gold', roleClass: 'text-gold', isMe: false },
  { rank: 5, initials: 'SM', name: 'Sarah Mitchell — you', role: 'Disciple', points: 610, avatarClass: 'bg-gold/[0.14] text-gold', roleClass: 'text-gold', isMe: true },
  { rank: 6, initials: 'JU', name: 'Julie Thompson', role: 'Pastor · Spouse', points: 570, avatarClass: 'bg-[rgba(180,115,123,0.16)] text-[rgb(180,115,123)]', roleClass: 'text-[rgb(180,115,123)]', isMe: false },
]

function BadgeIcon({ className }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}

export default function Progress() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/progress" />

      <main className="mx-auto max-w-[1180px] flex-1 min-w-0 px-8 py-9 pb-16">
        <div className="mb-7 flex items-center justify-between gap-5">
          <h1 className="m-0 text-[32px] font-bold uppercase leading-[1.04] text-white">My progress</h1>
          {/* "Preview celebration" opens the badge-earned modal below — kept as a real trigger for previewing the celebration state. */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="cursor-pointer rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E9CF9C]"
          >
            Preview celebration
          </button>
        </div>

        <div className="mb-[22px] grid grid-cols-[1.2fr_1fr_1fr] gap-[22px]">
          <div className="flex items-center gap-5 rounded-2xl border border-[rgba(232,145,71,0.3)] bg-[linear-gradient(160deg,rgba(232,145,71,0.12),rgba(30,36,22,0.4))] p-6">
            <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-full bg-[rgba(232,145,71,0.15)]">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E89147" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
            </div>
            <div>
              <div className="text-[38px] font-bold leading-none text-white">12 days</div>
              <div className="mt-[5px] text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(232,145,71)]">Current streak</div>
              <div className="mt-[3px] font-serif text-[13px] text-cream/60">Best: 12 days · 2 to Week Two Warrior</div>
            </div>
          </div>

          <div className="rounded-2xl border border-cream/[0.09] bg-[rgb(30,36,22)] p-6">
            <div className="text-[38px] font-bold leading-none text-white">1,240</div>
            <div className="mt-[5px] text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Points</div>
            <div className="mt-[3px] font-serif text-[13px] text-cream/60">+60 this week · daily resets ×5, episode ×1</div>
          </div>

          <div className="rounded-2xl border border-cream/[0.09] bg-[rgb(30,36,22)] p-6">
            <div className="text-[38px] font-bold leading-none text-white">
              4 <span className="text-xl text-cream/50">of 12</span>
            </div>
            <div className="mt-[5px] text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Badges earned</div>
            <div className="mt-[3px] font-serif text-[13px] text-cream/60">Next up: Freedom Builder</div>
          </div>
        </div>

        <div className="grid grid-cols-[1.55fr_1fr] items-start gap-[22px]">
          <div className="rounded-2xl border border-cream/[0.09] bg-[rgb(30,36,22)] p-6">
            <h2 className="m-0 mb-[18px] text-[15px] font-bold uppercase tracking-[0.1em] text-white">Badges</h2>
            <div className="grid grid-cols-3 gap-[14px]">
              {BADGES.map((badge) => (
                <div
                  key={badge.name}
                  className={`flex flex-col items-center gap-2 rounded-[13px] p-[18px_12px] text-center ${
                    badge.earned
                      ? 'border border-gold/[0.35] bg-gold/[0.07]'
                      : 'border border-cream/[0.07] bg-cream/[0.02] opacity-55'
                  }`}
                >
                  <div
                    className={`flex h-[46px] w-[46px] items-center justify-center rounded-full ${
                      badge.earned ? 'bg-gold/[0.18] text-gold' : 'bg-cream/[0.07] text-cream/40'
                    }`}
                  >
                    <BadgeIcon />
                  </div>
                  <div className="text-center text-[13px] font-bold uppercase tracking-[0.05em]">{badge.name}</div>
                  <div className="text-center font-serif text-xs leading-[1.45] text-cream/55">{badge.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-cream/[0.09] bg-[rgb(30,36,22)] p-6">
            <div className="mb-[18px] flex items-center justify-between">
              <h2 className="m-0 text-[15px] font-bold uppercase tracking-[0.1em] text-white">Leaderboard</h2>
              {/* Week/Month toggle — Week active by default */}
              <div className="flex gap-1 rounded-full bg-cream/[0.05] p-[3px]">
                <span className="rounded-full bg-gold px-[13px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.1em] text-ink">Week</span>
                <span className="cursor-pointer rounded-full px-[13px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.1em] text-cream/55">Month</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {LEADERS.map((leader) => (
                <div
                  key={leader.rank}
                  className={`flex items-center gap-[11px] rounded-[11px] border px-3 py-2.5 ${
                    leader.isMe ? 'border-gold/30 bg-gold/[0.09]' : 'border-transparent bg-transparent'
                  }`}
                >
                  <span
                    className={`w-5 shrink-0 text-center text-[13px] font-bold ${
                      leader.rank <= 3 ? 'text-[rgb(232,145,71)]' : 'text-cream/45'
                    }`}
                  >
                    {leader.rank}
                  </span>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold ${leader.avatarClass}`}>
                    {leader.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-semibold">{leader.name}</div>
                    <div className={`text-[10.5px] font-medium uppercase tracking-[0.1em] ${leader.roleClass}`}>{leader.role}</div>
                  </div>
                  <span className="text-[13.5px] font-bold text-[#E9CF9C]">{leader.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(10,13,7,0.8)] backdrop-blur-[6px]"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-[400px] rounded-[20px] border border-gold/40 bg-[linear-gradient(170deg,rgb(35,43,24),rgb(23,28,16))] p-[40px_36px] text-center shadow-[0_40px_90px_-20px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 flex h-[92px] w-[92px] items-center justify-center rounded-full border-2 border-gold bg-gold/[0.15]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            </div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Badge earned</div>
            <div className="mb-2.5 text-[28px] font-bold uppercase leading-[1.05] text-white">Freedom Builder</div>
            <p className="mb-[26px] font-serif text-[15px] leading-[1.6] text-cream/[72%]">
              Fourteen straight days of showing up. You're not just watching — you're building.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full cursor-pointer rounded-full border-none bg-gold py-[13px] font-sans text-[12.5px] font-semibold uppercase tracking-[0.12em] text-ink"
            >
              Keep going
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
