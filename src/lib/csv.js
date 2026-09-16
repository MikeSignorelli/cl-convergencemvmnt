import { extractVimeoId } from './vimeo'

// Minimal CSV parser for admin bulk-import (e.g. episode CSV upload).
// Handles a header row + data rows, and basic double-quoted fields
// containing commas (with "" as an escaped quote inside a quoted field).
//
// LIMITATION: this does NOT implement full RFC 4180 — a quoted field
// containing a literal newline will break, because rows are first split on
// "\n" before quote-aware parsing happens per line. Good enough for the
// simple, single-line-per-row CSVs this app's admin exports/re-imports;
// swap in a real CSV library first if that ever needs to change.
function parseLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current)
  return fields.map((f) => f.trim())
}

// Parses CSV text into an array of row-objects keyed by the header row.
// Blank lines are skipped. Returns [] for empty/whitespace-only input.
export function parseCsv(text) {
  const lines = (text || '').split(/\r\n|\r|\n/).filter((line) => line.trim() !== '')
  if (lines.length === 0) return []

  const headers = parseLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = parseLine(line)
    const row = {}
    headers.forEach((header, i) => {
      row[header] = values[i] ?? ''
    })
    return row
  })
}

// Validates one parsed episode-CSV row (expected keys: week, title,
// video_link, description, release_date — description/release_date are
// optional). `rowIndex` is used only to make error messages identify the
// offending row (1-based, matching a spreadsheet's data-row numbering).
export function validateEpisodeCsvRow(row, rowIndex) {
  const errors = []
  const label = `Row ${rowIndex}`

  const week = Number(row?.week)
  if (!row?.week || !Number.isInteger(week) || week <= 0) {
    errors.push(`${label}: "week" must be a positive integer`)
  }

  if (!row?.title || !String(row.title).trim()) {
    errors.push(`${label}: "title" is required`)
  }

  if (!row?.video_link || !String(row.video_link).trim()) {
    errors.push(`${label}: "video_link" is required`)
  } else if (!extractVimeoId(row.video_link)) {
    errors.push(`${label}: "video_link" must be a valid Vimeo URL or id`)
  }

  if (row?.release_date && String(row.release_date).trim()) {
    const parsed = new Date(row.release_date)
    if (Number.isNaN(parsed.getTime())) {
      errors.push(`${label}: "release_date" is not a valid date`)
    }
  }

  return { valid: errors.length === 0, errors }
}
