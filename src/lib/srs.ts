/**
 * Spaced repetition.
 *
 * The rule comes straight from 08-learning-path.md:
 *   "Show a card again after 1, 3, 7, 16, 35 days if answered correctly;
 *    reset if wrong. Track per-card ease."
 *
 * So the gap is chosen by a STREAK of correct answers, not by a formula:
 *   streak 1 -> 1 day, 2 -> 3, 3 -> 7, 4 -> 16, 5 -> 35, and 35 after that.
 * Getting it wrong sends the streak back to 0, so the card returns tomorrow.
 *
 * Ease is kept as a separate number (like SM-2) so a card you keep failing
 * comes back a little sooner than one you find easy. It never changes the
 * step you are on, only stretches or shrinks that step slightly.
 */

/** The ladder from file 08, in days. */
export const INTERVALS = [1, 3, 7, 16, 35] as const

export const EASE_MIN = 1.3
export const EASE_MAX = 2.8
export const EASE_START = 2.5
/** Getting it wrong drops the ease by this much. */
export const EASE_DOWN = 0.2
/** Getting it right raises the ease by this much. */
export const EASE_UP = 0.1

export interface ReviewState {
  /** How many correct answers in a row. 0 = new, or just got it wrong. */
  streak: number
  ease: number
  /** YYYY-MM-DD */
  next_review_date: string
  last_result: 'right' | 'wrong' | null
}

export function newCardState(today: string): ReviewState {
  return { streak: 0, ease: EASE_START, next_review_date: today, last_result: null }
}

/** The gap in days for a given streak, straight off the ladder. */
export function intervalForStreak(streak: number): number {
  if (streak <= 0) return INTERVALS[0]
  const index = Math.min(streak, INTERVALS.length) - 1
  return INTERVALS[index]
}

export function addDays(dateISO: string, days: number): string {
  // Built from parts so it never shifts by a timezone hour.
  const [y, m, d] = dateISO.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function clampEase(ease: number): number {
  if (!Number.isFinite(ease)) return EASE_START
  return Math.min(EASE_MAX, Math.max(EASE_MIN, Number(ease.toFixed(2))))
}

/**
 * Works out when a card should come back.
 *
 * Right: move one step up the ladder, nudge ease up.
 * Wrong: reset to step 0 (back tomorrow), nudge ease down.
 */
export function review(
  state: ReviewState,
  correct: boolean,
  today: string,
): ReviewState {
  if (!correct) {
    return {
      streak: 0,
      ease: clampEase(state.ease - EASE_DOWN),
      next_review_date: addDays(today, INTERVALS[0]),
      last_result: 'wrong',
    }
  }

  const streak = state.streak + 1
  const ease = clampEase(state.ease + EASE_UP)
  const base = intervalForStreak(streak)

  // Ease stretches the gap a little, but never past the next rung of the
  // ladder and never below one day, so the schedule stays recognisable.
  const scaled = Math.round(base * (ease / EASE_START))
  const ceiling = intervalForStreak(streak + 1)
  const days = Math.max(1, Math.min(scaled, ceiling))

  return {
    streak,
    ease,
    next_review_date: addDays(today, days),
    last_result: 'right',
  }
}

/** True when the card is due today or overdue. */
export function isDue(state: { next_review_date: string }, today: string): boolean {
  return state.next_review_date <= today
}

/** Picks the cards to study now: overdue first, then new ones. */
export function pickDue<T extends { slug: string }>(
  cards: T[],
  states: Map<string, ReviewState>,
  today: string,
  limit = 20,
): T[] {
  const due: { card: T; sort: string }[] = []
  const fresh: T[] = []

  for (const card of cards) {
    const state = states.get(card.slug)
    if (!state) {
      fresh.push(card)
    } else if (isDue(state, today)) {
      due.push({ card, sort: state.next_review_date })
    }
  }

  due.sort((a, b) => a.sort.localeCompare(b.sort))
  return [...due.map((d) => d.card), ...fresh].slice(0, limit)
}
