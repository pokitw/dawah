/** Tiny formatting helpers shared by the pages. */

export function difficultyLabel(d: string): string {
  return d.charAt(0).toUpperCase() + d.slice(1)
}

export function difficultyTone(d: string): 'good' | 'warn' | 'bad' | 'neutral' {
  if (d === 'easy') return 'good'
  if (d === 'medium') return 'warn'
  if (d === 'hard' || d === 'expert') return 'bad'
  return 'neutral'
}

/** "2026-09-21T..." -> "21 Sep 2026" */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Today as YYYY-MM-DD in the user's own timezone. */
export function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
