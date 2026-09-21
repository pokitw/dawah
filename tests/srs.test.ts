import { describe, expect, it } from 'vitest'
import {
  EASE_MAX,
  EASE_MIN,
  EASE_START,
  INTERVALS,
  addDays,
  clampEase,
  intervalForStreak,
  isDue,
  newCardState,
  pickDue,
  review,
  type ReviewState,
} from '../src/lib/srs'

const TODAY = '2026-09-21'

describe('the ladder from file 08', () => {
  it('is exactly 1, 3, 7, 16, 35 days', () => {
    expect([...INTERVALS]).toEqual([1, 3, 7, 16, 35])
  })

  it('maps each streak to its rung', () => {
    expect(intervalForStreak(1)).toBe(1)
    expect(intervalForStreak(2)).toBe(3)
    expect(intervalForStreak(3)).toBe(7)
    expect(intervalForStreak(4)).toBe(16)
    expect(intervalForStreak(5)).toBe(35)
  })

  it('stays at the top rung after 5 correct answers', () => {
    expect(intervalForStreak(6)).toBe(35)
    expect(intervalForStreak(50)).toBe(35)
  })

  it('treats a new or just-failed card as the first rung', () => {
    expect(intervalForStreak(0)).toBe(1)
    expect(intervalForStreak(-3)).toBe(1)
  })
})

describe('addDays', () => {
  it('adds days', () => {
    expect(addDays('2026-09-21', 1)).toBe('2026-09-22')
    expect(addDays('2026-09-21', 35)).toBe('2026-10-26')
  })

  it('crosses month and year ends', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('knows about leap years', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
  })

  it('does not drift by a timezone hour', () => {
    let date = '2026-01-01'
    for (let i = 0; i < 400; i++) date = addDays(date, 1)
    expect(date).toBe('2027-02-05')
  })
})

describe('review — getting it right', () => {
  it('walks a perfect card up the whole ladder', () => {
    let state = newCardState(TODAY)
    const gaps: number[] = []
    let day = TODAY

    for (let i = 0; i < 5; i++) {
      state = review(state, true, day)
      const before = new Date(`${day}T00:00:00Z`).getTime()
      const after = new Date(`${state.next_review_date}T00:00:00Z`).getTime()
      gaps.push(Math.round((after - before) / 86400000))
      day = state.next_review_date
    }

    expect(state.streak).toBe(5)
    // Each gap sits on its rung, never jumping past the next one.
    gaps.forEach((gap, i) => {
      expect(gap).toBeGreaterThanOrEqual(INTERVALS[i])
      expect(gap).toBeLessThanOrEqual(INTERVALS[Math.min(i + 1, INTERVALS.length - 1)])
    })
  })

  it('counts up the streak', () => {
    let state = newCardState(TODAY)
    state = review(state, true, TODAY)
    expect(state.streak).toBe(1)
    state = review(state, true, TODAY)
    expect(state.streak).toBe(2)
  })

  it('raises the ease', () => {
    const state = review(newCardState(TODAY), true, TODAY)
    expect(state.ease).toBeGreaterThan(EASE_START)
  })

  it('records the result', () => {
    expect(review(newCardState(TODAY), true, TODAY).last_result).toBe('right')
  })

  it('always schedules at least one day ahead', () => {
    let state = newCardState(TODAY)
    for (let i = 0; i < 10; i++) {
      state = review(state, true, TODAY)
      expect(state.next_review_date > TODAY).toBe(true)
    }
  })
})

describe('review — getting it wrong resets, as file 08 requires', () => {
  it('sends the streak back to zero from any height', () => {
    let state = newCardState(TODAY)
    for (let i = 0; i < 5; i++) state = review(state, true, TODAY)
    expect(state.streak).toBe(5)

    state = review(state, false, TODAY)
    expect(state.streak).toBe(0)
  })

  it('brings the card back tomorrow', () => {
    let state = newCardState(TODAY)
    for (let i = 0; i < 4; i++) state = review(state, true, TODAY)
    state = review(state, false, TODAY)
    expect(state.next_review_date).toBe(addDays(TODAY, 1))
  })

  it('lowers the ease', () => {
    const state = review(newCardState(TODAY), false, TODAY)
    expect(state.ease).toBeLessThan(EASE_START)
  })

  it('starts the ladder again from the bottom after a reset', () => {
    let state = review(newCardState(TODAY), false, TODAY)
    state = review(state, true, TODAY)
    expect(state.streak).toBe(1)
    expect(state.next_review_date).toBe(addDays(TODAY, 1))
  })
})

describe('ease stays inside its limits', () => {
  it('never rises above the maximum', () => {
    let state = newCardState(TODAY)
    for (let i = 0; i < 100; i++) state = review(state, true, TODAY)
    expect(state.ease).toBeLessThanOrEqual(EASE_MAX)
  })

  it('never falls below the minimum, so a hard card stays reachable', () => {
    let state = newCardState(TODAY)
    for (let i = 0; i < 100; i++) state = review(state, false, TODAY)
    expect(state.ease).toBeGreaterThanOrEqual(EASE_MIN)
  })

  it('falls back to the default for values that are not real numbers', () => {
    // NaN and Infinity mean the stored value is broken, not that the card is
    // very easy, so the safe answer is the starting ease rather than the top.
    expect(clampEase(NaN)).toBe(EASE_START)
    expect(clampEase(Infinity)).toBe(EASE_START)
    expect(clampEase(-Infinity)).toBe(EASE_START)
  })

  it('pulls a real number that is out of range back to the nearest limit', () => {
    expect(clampEase(99)).toBe(EASE_MAX)
    expect(clampEase(-5)).toBe(EASE_MIN)
  })
})

describe('isDue', () => {
  const state = (d: string): ReviewState => ({
    streak: 1, ease: 2.5, next_review_date: d, last_result: 'right',
  })

  it('is due on the day and after it', () => {
    expect(isDue(state(TODAY), TODAY)).toBe(true)
    expect(isDue(state('2026-09-01'), TODAY)).toBe(true)
  })

  it('is not due before the day', () => {
    expect(isDue(state('2026-09-22'), TODAY)).toBe(false)
  })
})

describe('pickDue', () => {
  const cards = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }, { slug: 'd' }]
  const states = new Map<string, ReviewState>([
    ['a', { streak: 1, ease: 2.5, next_review_date: '2026-09-10', last_result: 'right' }],
    ['b', { streak: 2, ease: 2.5, next_review_date: '2026-10-30', last_result: 'right' }],
    ['c', { streak: 1, ease: 2.5, next_review_date: '2026-09-05', last_result: 'right' }],
  ])

  it('puts the most overdue card first', () => {
    expect(pickDue(cards, states, TODAY).map((x) => x.slug)).toEqual(['c', 'a', 'd'])
  })

  it('leaves out cards that are not due yet', () => {
    expect(pickDue(cards, states, TODAY).some((x) => x.slug === 'b')).toBe(false)
  })

  it('includes cards never seen before, after the overdue ones', () => {
    const picked = pickDue(cards, states, TODAY)
    expect(picked[picked.length - 1].slug).toBe('d')
  })

  it('respects the limit', () => {
    expect(pickDue(cards, states, TODAY, 1)).toHaveLength(1)
  })

  it('returns nothing when every card is scheduled for later', () => {
    const future = new Map(
      cards.map((c) => [
        c.slug,
        { streak: 3, ease: 2.5, next_review_date: '2027-01-01', last_result: 'right' } as ReviewState,
      ]),
    )
    expect(pickDue(cards, future, TODAY)).toEqual([])
  })
})
