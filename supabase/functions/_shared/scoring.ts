/**
 * Scorecard maths, server copy.
 *
 * A deliberate copy of `src/lib/scoring.ts`. The server is what writes to
 * the database, so it must do the maths itself and never trust a total the
 * model sent. `tests/scoring.test.ts` fails if the two copies drift.
 */

export const RUBRIC_KEYS = [
  'logic',
  'sources',
  'understanding',
  'clarity',
  'adab',
  'overclaim',
] as const

export type RubricKey = (typeof RUBRIC_KEYS)[number]
export type RubricScores = Record<RubricKey, number>

export const BANDS = [
  { min: 26, max: 30, name: 'Excellent' },
  { min: 20, max: 25, name: 'Strong' },
  { min: 14, max: 19, name: 'Okay' },
  { min: 8, max: 13, name: 'Weak' },
  { min: 0, max: 7, name: 'Needs work' },
] as const

export function clampScore(value: unknown): number {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return 0
  return Math.min(5, Math.max(0, n))
}

export function normalizeScores(raw: Partial<Record<RubricKey, unknown>>): RubricScores {
  return RUBRIC_KEYS.reduce((acc, key) => {
    acc[key] = clampScore(raw[key])
    return acc
  }, {} as RubricScores)
}

export function totalOf(scores: RubricScores): number {
  return RUBRIC_KEYS.reduce((sum, key) => sum + scores[key], 0)
}

export function bandFor(total: number): string {
  const clamped = Math.min(30, Math.max(0, Math.round(total)))
  const band = BANDS.find((b) => clamped >= b.min && clamped <= b.max)
  return (band ?? BANDS[BANDS.length - 1]).name
}

export const DIFFICULTY_BONUS: Record<string, number> = {
  easy: 0,
  medium: 5,
  hard: 10,
  expert: 15,
}

export function xpForDebate(total: number, difficulty: string): number {
  const base = 10
  const performance = Math.round(Math.min(30, Math.max(0, total)) * 2)
  const bonus = DIFFICULTY_BONUS[difficulty] ?? 0
  return base + performance + bonus
}

export function weaknessUpdates(
  scores: RubricScores,
  sourcesToReview: string[],
): { tag: string; score: number }[] {
  const updates: { tag: string; score: number }[] = RUBRIC_KEYS.map((key) => ({
    tag: key as string,
    score: scores[key],
  }))

  for (const raw of sourcesToReview) {
    const tag = raw.trim().toUpperCase()
    if (/^(ARG|OBJ|QA)-\d+$/.test(tag)) {
      updates.push({ tag, score: scores.sources })
    }
  }

  return updates
}
