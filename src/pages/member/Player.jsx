import { useState } from 'react'
import { Link } from 'react-router-dom'
import playerVideoThumbnail from '../../assets/app-images/player-video-thumbnail.jpg'

function NoteCard({ timestamp, children }) {
  return (
    <div className="rounded-[11px] border border-cream/[0.08] bg-cream/[0.03] px-[15px] py-[13px]">
      <div className="mb-[5px] font-sans text-[11px] font-bold tracking-[0.08em] text-gold">{timestamp}</div>
      <div className="font-serif text-[14px] leading-[1.55] text-cream/80">{children}</div>
    </div>
  )
}

export default function Player() {
  const [notesOpen, setNotesOpen] = useState(true)
  const [done, setDone] = useState(false)
  const [notes, setNotes] = useState([])
  const [draft, setDraft] = useState('')

  function handleSaveNote() {
    if (!draft.trim()) return
    setNotes((prev) => [...prev, draft])
    setDraft('')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[rgb(12,14,8)] font-sans text-cream antialiased">
      {/* Header */}
      <header className="flex h-[60px] items-center justify-between gap-6 border-b border-cream/[0.06] px-6">
        <Link
          to="/courses/detail"
          className="flex items-center gap-2 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-cream/65 no-underline"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to course
        </Link>

        <div className="min-w-0 text-center">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-cream/40">
            Inherit Your Freedom · Week 2
          </div>
          <div className="overflow-hidden text-ellipsis whitespace-nowrap font-sans text-[14px] font-semibold tracking-[0.03em]">
            Identifying Root Beliefs
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => setNotesOpen((v) => !v)}
            className={`flex cursor-pointer items-center gap-2 rounded-full border px-[18px] py-[9px] font-sans text-[11.5px] font-semibold uppercase tracking-[0.12em] ${
              notesOpen ? 'border-gold/50 bg-gold/[0.13] text-[#E9CF9C]' : 'border-cream/20 bg-transparent text-cream/70'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            Notes
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/[0.14] font-sans text-[12px] font-bold text-gold">
            SM
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Main video column */}
        <div className="flex flex-1 min-w-0 flex-col gap-[18px] px-7 pb-7 pt-6">
          <div className="relative aspect-video max-h-[62vh] overflow-hidden rounded-[14px] border border-cream/[0.08] bg-black">
            <img
              src={playerVideoThumbnail}
              alt=""
              className="absolute inset-0 h-full w-full object-cover brightness-[0.55]"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                className="flex h-[76px] w-[76px] cursor-pointer items-center justify-center rounded-full border-none bg-gold/95 shadow-[0_18px_44px_-10px_rgba(0,0,0,0.8)]"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#171C10" className="ml-[3px]">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-[18px] pb-3 pt-3.5">
              <div className="relative mb-2.5 h-1 rounded-full bg-white/[22%]">
                <div className="h-full w-[38%] rounded-full bg-gold" />
                <div className="absolute left-[38%] top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E9CF9C]" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-white/85">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5 6 9H2v6h4l5 4z" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                  <span className="font-sans text-[12px] font-semibold tracking-[0.06em]">09:12 / 24:03</span>
                </div>
                <div className="flex items-center gap-4 text-white/85">
                  <span className="rounded-[5px] border border-white/35 px-[7px] py-0.5 font-sans text-[11px] font-semibold tracking-[0.1em]">
                    1.25×
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h20v14H2z" />
                    <path d="M8 21h8" />
                    <path d="M12 17v4" />
                  </svg>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="min-w-0">
              <div className="mb-1 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                Week 2 · Episode 1 of 3
              </div>
              <h1 className="m-0 font-sans text-2xl font-bold uppercase leading-[1.05] text-white">
                Identifying Root Beliefs
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {done ? (
                <div className="flex items-center gap-[9px] rounded-full bg-gold/[0.14] px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-gold">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Completed
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setDone(true)}
                  className="flex cursor-pointer items-center gap-[9px] rounded-full border-none bg-gold px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-ink"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Mark complete
                </button>
              )}
              <a
                href="#"
                className="flex items-center gap-[9px] rounded-full border border-cream/[0.22] px-[22px] py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-cream no-underline"
              >
                Next episode
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </a>
            </div>
          </div>

          <div className="mt-1.5 flex gap-3.5">
            <div className="flex flex-1 items-center gap-[13px] rounded-xl border border-cream/[0.08] bg-[rgb(22,27,15)] px-4 py-[13px]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(240,238,229,0.7)">
                <path d="M8 5v14l11-7z" />
              </svg>
              <div className="min-w-0">
                <div className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream/40">
                  Up next · Episode 2
                </div>
                <div className="font-sans text-[14px] font-semibold">The Void Section · 19 min</div>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-[13px] rounded-xl border border-cream/[0.08] bg-[rgb(22,27,15)] px-4 py-[13px]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(240,238,229,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              <div className="min-w-0">
                <div className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream/40">
                  Workbook
                </div>
                <div className="font-sans text-[14px] font-semibold">Week 2 Belief Audit (PDF)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes sidebar */}
        {notesOpen && (
          <aside className="flex w-[340px] shrink-0 flex-col border-l border-cream/[0.07] bg-[rgb(18,21,12)]">
            <div className="flex items-center justify-between border-b border-cream/[0.07] px-5 pb-3.5 pt-[18px]">
              <div className="font-sans text-[13px] font-bold uppercase tracking-[0.12em]">My notes</div>
              <span className="font-sans text-[11px] font-semibold tracking-[0.08em] text-cream/40">
                Saved automatically
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
              <NoteCard timestamp="03:41">
                Root belief ≠ the behavior. The behavior is the fruit — find the root.
              </NoteCard>
              <NoteCard timestamp="07:58">
                Write the belief in the exact words I say it to myself. No paraphrasing.
              </NoteCard>
              {notes.map((note, i) => (
                <NoteCard key={i} timestamp="09:12">
                  {note}
                </NoteCard>
              ))}
            </div>
            <div className="border-t border-cream/[0.07] px-5 pb-5 pt-4">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a note at 09:12…"
                className="min-h-[74px] w-full resize-y rounded-[11px] border border-cream/[0.12] bg-cream/[0.04] px-[14px] py-3 font-serif text-[14px] leading-[1.5] text-cream outline-none placeholder:text-cream/40"
              />
              <button
                type="button"
                onClick={handleSaveNote}
                className="mt-2.5 w-full cursor-pointer rounded-full border-none bg-gold py-[11px] font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-ink"
              >
                Save note
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
