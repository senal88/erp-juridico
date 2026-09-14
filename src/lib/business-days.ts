/**
 * Calculates Easter Sunday for a given year using the Meeus/Jones/Butcher algorithm.
 */
export function getEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1 // 0-based month
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

/**
 * Calculates floating Brazilian holidays (Carnival, Good Friday, Corpus Christi).
 */
export function getFloatingHolidays(year: number): Date[] {
  const easter = getEaster(year)

  const carnival = new Date(easter)
  carnival.setDate(easter.getDate() - 47)

  const goodFriday = new Date(easter)
  goodFriday.setDate(easter.getDate() - 2)

  const corpusChristi = new Date(easter)
  corpusChristi.setDate(easter.getDate() + 60)

  return [carnival, goodFriday, corpusChristi]
}

const FIXED_HOLIDAYS = [
  '01-01', // Confraternização Universal
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalhador
  '09-07', // Independência do Brasil
  '10-12', // Nossa Senhora Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '11-20', // Consciência Negra
  '12-25', // Natal
]

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

/**
 * Checks if a given date is a Brazilian national holiday.
 */
export function isHoliday(date: Date): boolean {
  const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`

  if (FIXED_HOLIDAYS.includes(monthDay)) {
    return true
  }

  const floating = getFloatingHolidays(date.getFullYear())
  return floating.some((h) => isSameDay(h, date))
}

/**
 * Checks if a given date falls within the CNJ Forensic Recess
 * (Dec 20th to Jan 6th, inclusive).
 */
export function isForensicRecess(date: Date): boolean {
  const month = date.getMonth()
  const day = date.getDate()

  // Dec 20 to Dec 31
  if (month === 11 && day >= 20) return true
  // Jan 1 to Jan 6
  if (month === 0 && day <= 6) return true

  return false
}

/**
 * Checks if a given date is a business day (excluding weekends, holidays, and forensic recess).
 */
export function isBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) return false // Sunday = 0, Saturday = 6
  if (isHoliday(date)) return false
  if (isForensicRecess(date)) return false
  return true
}

/**
 * Returns the next available business day after the provided date.
 */
export function nextBusinessDay(date: Date): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + 1)
  while (!isBusinessDay(next)) {
    next.setDate(next.getDate() + 1)
  }
  return next
}

/**
 * Adds or subtracts a specific number of business days from a given date.
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let added = 0
  const step = days >= 0 ? 1 : -1
  const target = Math.abs(days)

  while (added < target) {
    result.setDate(result.getDate() + step)
    if (isBusinessDay(result)) {
      added++
    }
  }
  return result
}

/**
 * Calculates the difference in business days between two dates.
 */
export function businessDaysDiff(d1: Date, d2: Date): number {
  let start = new Date(d1)
  let end = new Date(d2)
  let reverse = false

  // Set time to midnight to avoid DST issues and partial days
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  if (start.getTime() > end.getTime()) {
    ;[start, end] = [end, start]
    reverse = true
  }

  let days = 0
  const current = new Date(start)
  while (current.getTime() < end.getTime()) {
    current.setDate(current.getDate() + 1)
    if (isBusinessDay(current)) {
      days++
    }
  }

  return reverse ? -days : days
}
