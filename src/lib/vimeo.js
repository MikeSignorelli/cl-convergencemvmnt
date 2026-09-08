// Parses the handful of URL shapes Vimeo actually hands out (plain,
// unlisted-with-hash, channel/group links, and the player.vimeo.com embed
// URL itself) into a bare {id, hash}. Returns null for anything that isn't
// a vimeo.com/player.vimeo.com URL, so callers can fall back to a plain
// link for other providers.
export function parseVimeoUrl(url) {
  if (!url) return null
  const trimmed = url.trim()
  let parsed
  try {
    parsed = new URL(trimmed)
  } catch {
    // Admins often paste a bare "vimeo.com/..." without a scheme.
    try {
      parsed = new URL(`https://${trimmed}`)
    } catch {
      return null
    }
  }
  if (!/(^|\.)vimeo\.com$/i.test(parsed.hostname)) return null

  if (parsed.hostname === 'player.vimeo.com') {
    const match = parsed.pathname.match(/\/video\/(\d+)/)
    if (!match) return null
    return { id: match[1], hash: parsed.searchParams.get('h') || '' }
  }

  const segments = parsed.pathname.split('/').filter(Boolean)
  const idIndex = segments.findLastIndex((s) => /^\d+$/.test(s))
  if (idIndex === -1) return null
  const next = segments[idIndex + 1]
  const hash = next && /^[a-zA-Z0-9]+$/.test(next) ? next : ''
  return { id: segments[idIndex], hash }
}

// Builds the player.vimeo.com embed URL for an <iframe>, with the hash
// carried over for unlisted videos and a few display params (no title
// card/byline/portrait, respect Do Not Track) so the embed matches the
// site's own chrome instead of Vimeo's default overlay.
export function getVimeoEmbedUrl(url) {
  const parsed = parseVimeoUrl(url)
  if (!parsed) return null
  const params = new URLSearchParams({ title: '0', byline: '0', portrait: '0', dnt: '1' })
  if (parsed.hash) params.set('h', parsed.hash)
  return `https://player.vimeo.com/video/${parsed.id}?${params.toString()}`
}
