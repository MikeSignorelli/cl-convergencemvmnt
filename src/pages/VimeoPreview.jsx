import { useState } from 'react'
import VimeoPlayer from '../components/VimeoPlayer'

// TEMPORARY preview page (public) to confirm the Vimeo embed, SDK events, and
// progress persistence work without logging in. Progress is stored in
// localStorage here purely for the demo — real members will persist to the
// database. Safe to delete along with its /vimeo-preview route.
const SAMPLE = 'https://vimeo.com/22439234'
const keyFor = (v) => 'cv-vimeo-progress:' + v

function readProgress(v) {
  try {
    return JSON.parse(localStorage.getItem(keyFor(v)) || 'null') || {}
  } catch {
    return {}
  }
}

function fmt(sec) {
  if (!sec && sec !== 0) return '—'
  const s = Math.floor(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function VimeoPreview() {
  const [input, setInput] = useState(SAMPLE)
  const [video, setVideo] = useState(SAMPLE)
  const [resumeFrom, setResumeFrom] = useState(() => readProgress(SAMPLE).seconds || 0)
  const [progress, setProgress] = useState(() => readProgress(SAMPLE))
  const [last, setLast] = useState(null)

  function load(e) {
    e.preventDefault()
    const v = input.trim()
    if (!v) return
    const saved = readProgress(v)
    setVideo(v)
    setResumeFrom(saved.seconds || 0)
    setProgress(saved)
    setLast(null)
  }

  function save(data) {
    setProgress(data)
    localStorage.setItem(keyFor(video), JSON.stringify(data))
  }
  function handleProgress(d) {
    save({ seconds: d.seconds, percent: d.percent, duration: d.duration, completed: progress.completed || false })
  }
  function handleComplete() {
    save({ ...progress, completed: true })
  }
  function reset() {
    localStorage.removeItem(keyFor(video))
    setProgress({})
    setResumeFrom(0)
    setLast(null)
  }

  const pct = Math.round((progress.percent || 0) * 100)

  return (
    <div className="min-h-screen bg-ink px-6 py-12 font-sans text-cream antialiased">
      <div className="mx-auto max-w-[900px]">
        <p className="mb-6 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-cream/45">
          Vimeo player + progress preview (temporary route · /vimeo-preview)
        </p>

        <form onSubmit={load} className="mb-6 flex gap-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://vimeo.com/… or a video id"
            className="flex-1 rounded-full border border-cream/[0.14] bg-cream/[0.04] px-5 py-3 font-sans text-[13.5px] text-cream outline-none placeholder:text-cream/40"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-full border-none bg-gold px-6 py-3 font-sans text-[12.5px] font-semibold uppercase tracking-[0.12em] text-ink"
          >
            Load
          </button>
        </form>

        {resumeFrom > 0 && (
          <p className="mb-3 font-serif text-[13.5px] text-[#9BC08A]">
            ↻ Resumed from {fmt(resumeFrom)} — reload the page and it picks up where you left off.
          </p>
        )}

        <VimeoPlayer
          key={`${video}#${resumeFrom}`}
          video={video}
          startAt={resumeFrom}
          completeAt={0.9}
          onProgress={handleProgress}
          onComplete={handleComplete}
          onEvent={setLast}
        />

        <div className="mt-4 rounded-cv-lg border border-cream/[0.09] bg-[rgb(22,27,15)] px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream/45">
              Progress (saved to this browser)
            </div>
            {progress.completed ? (
              <span className="flex items-center gap-1.5 rounded-full bg-gold/[0.16] px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-[#E9CF9C]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Completed
              </span>
            ) : (
              <span className="font-sans text-[12px] font-semibold text-cream/60">
                {fmt(progress.seconds || 0)} / {fmt(progress.duration)} · {pct}%
              </span>
            )}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-cream/[0.1]">
            <div className="h-full rounded-full bg-gold transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
          <button
            type="button"
            onClick={reset}
            className="mt-3.5 cursor-pointer rounded-full border border-cream/20 bg-transparent px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/70"
          >
            Reset progress
          </button>
        </div>

        <div className="mt-3 rounded-cv-lg border border-cream/[0.09] bg-[rgb(22,27,15)] px-5 py-4">
          <div className="mb-2 font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream/45">
            Live SDK events
          </div>
          {last ? (
            <div className="font-sans text-[14px] text-cream/85">
              <span className="font-semibold uppercase tracking-[0.08em] text-gold">{last.type}</span>
              {typeof last.seconds === 'number' && (
                <span className="ml-3 text-cream/70">
                  {last.seconds.toFixed(1)}s / {last.duration ? last.duration.toFixed(1) : '—'}s ·{' '}
                  {Math.round((last.percent || 0) * 100)}%
                </span>
              )}
            </div>
          ) : (
            <div className="font-serif text-[14px] text-cream/45">
              Press play — play / pause / timeupdate / ended stream here in real time.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
