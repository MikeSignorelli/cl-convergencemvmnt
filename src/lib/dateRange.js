// Shared "date range preset" picker logic for the admin Orders and
// Analytics pages, so the two never quietly disagree about what "This
// month" or "All time" means.
export const RANGE_PRESETS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'month', label: 'This month' },
  { key: 'year', label: 'This year' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Custom range' },
]

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function endOfDay(d) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

// `earliest` (a Date, or an ISO string) backs the 'all' preset — pass the
// earliest date in whatever dataset the caller is charting (signups,
// transactions, ...) so "All time" starts at real data instead of an
// arbitrary lookback window.
export function rangeFromPreset(preset, { customStart, customEnd, earliest } = {}) {
  const now = new Date()
  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) }
    case '7d': {
      const start = startOfDay(now)
      start.setDate(start.getDate() - 6)
      return { start, end: endOfDay(now) }
    }
    case '30d': {
      const start = startOfDay(now)
      start.setDate(start.getDate() - 29)
      return { start, end: endOfDay(now) }
    }
    case '90d': {
      const start = startOfDay(now)
      start.setDate(start.getDate() - 89)
      return { start, end: endOfDay(now) }
    }
    case 'month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now) }
    case 'year':
      return { start: new Date(now.getFullYear(), 0, 1), end: endOfDay(now) }
    case 'custom': {
      const start = customStart ? startOfDay(new Date(customStart)) : startOfDay(now)
      const end = customEnd ? endOfDay(new Date(customEnd)) : endOfDay(now)
      return { start, end }
    }
    case 'all':
    default: {
      const start = earliest ? startOfDay(new Date(earliest)) : startOfDay(now)
      return { start, end: endOfDay(now) }
    }
  }
}
