export function formatMinutes(minutes: number): string {
  if (!minutes || isNaN(minutes) || minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function parseDuration(str: string): number {
  if (!str) return 0
  const s = str.trim().toLowerCase()

  // Format "1:30"
  if (s.includes(':')) {
    const parts = s.split(':')
    const h = parseInt(parts[0], 10) || 0
    const m = parseInt(parts[1], 10) || 0
    return h * 60 + m
  }

  // Formats "1h 30m", "1h", "30m"
  let minutes = 0
  const hMatch = s.match(/(\d+)\s*h/)
  const mMatch = s.match(/(\d+)\s*m/)

  if (hMatch || mMatch) {
    if (hMatch) minutes += parseInt(hMatch[1], 10) * 60
    if (mMatch) minutes += parseInt(mMatch[1], 10)
    return minutes
  }

  // Raw number format e.g. "90"
  const raw = parseInt(s, 10)
  if (!isNaN(raw)) return raw

  return 0
}

export function calculateBillableAmount(minutes: number, hourlyRate: number): number {
  if (!minutes || !hourlyRate || minutes < 0 || hourlyRate < 0) return 0
  return (minutes / 60) * hourlyRate
}

export function sumMinutes(entries: { duration_minutes?: number }[]): number {
  if (!entries || !Array.isArray(entries)) return 0
  return entries.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0)
}

export function sumBillableAmount(
  entries: { is_billable?: boolean; duration_minutes?: number; hourly_rate?: number }[],
): number {
  if (!entries || !Array.isArray(entries)) return 0
  return entries.reduce((acc, curr) => {
    if (curr.is_billable && curr.duration_minutes && curr.hourly_rate) {
      return acc + calculateBillableAmount(curr.duration_minutes, curr.hourly_rate)
    }
    return acc
  }, 0)
}
