import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  BANDS,
  RUBRIC_KEYS,
  bandFor,
  clampScore,
  normalizeScores,
  studyNext,
  totalOf,
  weaknessUpdates,
  xpForDebate,
  xpForQuiz,
  xpForReviews,
} from '../src/lib/scoring'

const full = { logic: 5, sources: 5, understanding: 5, clarity: 5, adab: 5, overclaim: 5 }
const zero = { logic: 0, sources: 0, understanding: 0, clarity: 0, adab: 0, overclaim: 0 }

describe('clampScore', () => {
  it('keeps whole numbers inside 0-5', () => {
    expect(clampScore(3)).toBe(3)
    expect(clampScore(0)).toBe(0)
    expect(clampScore(5)).toBe(5)
  })

  it('pulls out-of-range values back in', () => {
    expect(clampScore(9)).toBe(5)
    expect(clampScore(-4)).toBe(0)
    expect(clampScore(5.6)).toBe(5)
  })

  it('rounds halves and decimals', () => {
    expect(clampScore(3.4)).toBe(3)
    expect(clampScore(3.5)).toBe(4)
  })

  it('treats rubbish from the model as 0 rather than crashing', () => {
    expect(clampScore(undefined)).toBe(0)
    expect(clampScore(null)).toBe(0)
    expect(clampScore('four')).toBe(0)
    expect(clampScore(NaN)).toBe(0)
    expect(clampScore(Infinity)).toBe(0)
    expect(clampScore({})).toBe(0)
  })

  it('accepts a numeric string, which models sometimes send', () => {
    expect(clampScore('4')).toBe(4)
  })
})

describe('normalizeScores', () => {
  it('always returns all six keys', () => {
    const result = normalizeScores({})
    expect(Object.keys(result).sort()).toEqual([...RUBRIC_KEYS].sort())
    expect(totalOf(result)).toBe(0)
  })

  it('ignores extra keys the model invents', () => {
    const result = normalizeScores({ ...full, style: 5 } as Record<string, unknown>)
    expect(totalOf(result)).toBe(30)
    expect('style' in result).toBe(false)
  })
})

describe('totalOf', () => {
  it('adds the six parts', () => {
    expect(totalOf(full)).toBe(30)
    expect(totalOf(zero)).toBe(0)
    expect(totalOf({ ...zero, logic: 4, adab: 3 })).toBe(7)
  })

  it('can never exceed 30 after normalising', () => {
    const cheated = normalizeScores({
      logic: 50, sources: 50, understanding: 50,
      clarity: 50, adab: 50, overclaim: 50,
    })
    expect(totalOf(cheated)).toBe(30)
  })
})

describe('bandFor', () => {
  it('uses the bands from file 06', () => {
    expect(bandFor(30)).toBe('Excellent')
    expect(bandFor(26)).toBe('Excellent')
    expect(bandFor(25)).toBe('Strong')
    expect(bandFor(20)).toBe('Strong')
    expect(bandFor(19)).toBe('Okay')
    expect(bandFor(14)).toBe('Okay')
    expect(bandFor(13)).toBe('Weak')
    expect(bandFor(8)).toBe('Weak')
    expect(bandFor(7)).toBe('Needs work')
    expect(bandFor(0)).toBe('Needs work')
  })

  it('covers every score from 0 to 30 with no gaps', () => {
    for (let i = 0; i <= 30; i++) {
      expect(typeof bandFor(i)).toBe('string')
      expect(bandFor(i).length).toBeGreaterThan(0)
    }
  })

  it('handles values outside the range safely', () => {
    expect(bandFor(-5)).toBe('Needs work')
    expect(bandFor(99)).toBe('Excellent')
  })

  it('has bands that touch without overlapping', () => {
    const sorted = [...BANDS].sort((a, b) => a.min - b.min)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].min).toBe(sorted[i - 1].max + 1)
    }
    expect(sorted[0].min).toBe(0)
    expect(sorted[sorted.length - 1].max).toBe(30)
  })
})

describe('xpForDebate', () => {
  it('always gives something for finishing', () => {
    expect(xpForDebate(0, 'easy')).toBe(10)
  })

  it('pays more for a better score', () => {
    expect(xpForDebate(30, 'easy')).toBe(70)
    expect(xpForDebate(15, 'easy')).toBe(40)
  })

  it('pays more for a harder opponent', () => {
    expect(xpForDebate(20, 'expert')).toBeGreaterThan(xpForDebate(20, 'easy'))
    expect(xpForDebate(20, 'expert') - xpForDebate(20, 'easy')).toBe(15)
  })

  it('never goes negative or silly', () => {
    expect(xpForDebate(-10, 'easy')).toBe(10)
    expect(xpForDebate(999, 'expert')).toBe(85)
  })

  it('treats an unknown difficulty as no bonus', () => {
    expect(xpForDebate(10, 'nonsense')).toBe(xpForDebate(10, 'easy'))
  })
})

describe('xpForQuiz and xpForReviews', () => {
  it('rewards finishing plus each correct answer', () => {
    expect(xpForQuiz(0, 4)).toBe(5)
    expect(xpForQuiz(4, 4)).toBe(17)
  })

  it('cannot be gamed with a score above the total', () => {
    expect(xpForQuiz(99, 4)).toBe(17)
  })

  it('returns nothing for an empty quiz', () => {
    expect(xpForQuiz(3, 0)).toBe(0)
  })

  it('pays 1 per card and 2 for a correct one', () => {
    expect(xpForReviews([])).toBe(0)
    expect(xpForReviews([{ correct: true }, { correct: false }])).toBe(3)
  })
})

describe('weaknessUpdates', () => {
  it('makes one update per rubric part', () => {
    const updates = weaknessUpdates(full, [])
    expect(updates).toHaveLength(6)
    expect(updates.map((u) => u.tag).sort()).toEqual([...RUBRIC_KEYS].sort())
  })

  it('adds the sources to review, carrying the sources score', () => {
    const updates = weaknessUpdates({ ...full, sources: 2 }, ['OBJ-2', 'ARG-2'])
    const obj = updates.find((u) => u.tag === 'OBJ-2')
    expect(obj).toEqual({ tag: 'OBJ-2', score: 2 })
  })

  it('ignores anything that is not a real id', () => {
    const updates = weaknessUpdates(full, ['not-an-id', '', 'OBJ-', 'DROP TABLE'])
    expect(updates).toHaveLength(6)
  })

  it('uppercases ids so obj-2 and OBJ-2 are one tag', () => {
    const updates = weaknessUpdates(full, ['obj-2'])
    expect(updates.some((u) => u.tag === 'OBJ-2')).toBe(true)
  })
})

describe('studyNext', () => {
  const stats = [
    { tag: 'adab', attempts: 3, avg_score: 4.5 },
    { tag: 'OBJ-2', attempts: 2, avg_score: 1.0 },
    { tag: 'logic', attempts: 5, avg_score: 2.5 },
    { tag: 'never-tried', attempts: 0, avg_score: 0 },
  ]

  it('puts the weakest first', () => {
    expect(studyNext(stats).map((s) => s.tag)).toEqual(['OBJ-2', 'logic', 'adab'])
  })

  it('leaves out things never attempted, so a new user sees nothing false', () => {
    expect(studyNext(stats).some((s) => s.tag === 'never-tried')).toBe(false)
  })

  it('respects the limit', () => {
    expect(studyNext(stats, 2)).toHaveLength(2)
  })

  it('does not change the array it was given', () => {
    const copy = [...stats]
    studyNext(stats)
    expect(stats).toEqual(copy)
  })
})

describe('the server copy of the scoring maths matches the browser copy', () => {
  // The edge function must do its own maths (it writes the database), but the
  // two copies must never drift apart.
  const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
  const client = read('src/lib/scoring.ts')
  const server = read('supabase/functions/_shared/scoring.ts')

  const fnBody = (src: string, name: string) => {
    const start = src.indexOf(`export function ${name}(`)
    expect(start, `${name} missing`).toBeGreaterThan(-1)
    const rest = src.slice(start)
    const end = rest.indexOf('\n}\n')
    return rest.slice(0, end).replace(/\s+/g, ' ')
  }

  for (const name of [
    'clampScore',
    'normalizeScores',
    'totalOf',
    'xpForDebate',
    'weaknessUpdates',
  ]) {
    it(`${name} is identical in both files`, () => {
      expect(fnBody(server, name)).toBe(fnBody(client, name))
    })
  }

  it('the bands table is identical in both files', () => {
    const table = (src: string) =>
      src.slice(src.indexOf('export const BANDS'), src.indexOf('] as const')).replace(/\s+/g, ' ')
    expect(table(server)).toBe(table(client))
  })
})
