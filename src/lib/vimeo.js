// Vimeo helpers: pulling a numeric video id out of the various link shapes an
// admin might paste, and fetching public metadata (title/duration/thumbnail)
// via Vimeo's oEmbed endpoint for videos that don't need API auth.

// Extracts the numeric Vimeo id from a full URL
// (https://vimeo.com/123456789, https://vimeo.com/123456789/abcdef — the
// trailing segment is a private-link hash — or
// https://player.vimeo.com/video/123456789), or returns a bare numeric
// string as-is. Returns null if no numeric id can be found.
export function extractVimeoId(urlOrId) {
  if (urlOrId == null) return null
  const value = String(urlOrId).trim()
  if (!value) return null

  if (/^\d+$/.test(value)) return value

  const match = value.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
  return match ? match[1] : null
}

// Fetches title/duration/thumbnail for a public Vimeo video via oEmbed.
// `url` should be a full vimeo.com URL (not a bare id). Throws a clear Error
// when Vimeo responds with a non-200 status (e.g. an invalid or private
// video the oEmbed endpoint can't see).
export async function fetchVimeoOEmbed(url) {
  const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error(`Vimeo oEmbed request failed (${response.status}): invalid or private video`)
  }
  const data = await response.json()
  return {
    title: data.title,
    duration: data.duration,
    thumbnailUrl: data.thumbnail_url,
  }
}
