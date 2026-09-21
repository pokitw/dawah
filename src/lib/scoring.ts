/**
 * Scorecard maths.
 *
 * The AI judges each of the six rubric parts from file 06. Everything after
 * that — the total, the band, the XP — is plain arithmetic done here, so it
 * is the same every time and can be tested without calling the AI.
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

/** The plain-English label for each part, shown on the scorecard. */
export const RUBRIC_LABELS: Record<RubricKey, string> = {
  logic: 'Logic',
  sources: 'Islamic sources',
  understanding: 'Understanding them',
  clarity: 'Clarity',
  adab: 'Adab (kindness)',
  overclaim: 'Avoiding overclaim',
}

export const RUBRIC_HELP: Record<RubricKey, string> = {
  logic: 'Was the argument valid and sound? Did you avoid fallacies?',
  sources: 'Were the verses, hadith and fatwas correct? Invented ones lose a lot.',
  understanding: 'Did you say their view fairly (steelman) and answer the real point?',
  clarity: 'Was it simple, clear and well organised?',
  adab: 'Were you gentle and respectful? No mocking (16:125, 3:159).',
  overclaim: 'Did you avoid "proven!" and "scientific miracle"?',
}

/** Bands come straight from file 06. */
export const BANDS = [
  { min: 26, max: 30, name: 'Excellent' },
  { min: 20, max: 25, name: 'Strong' },
  { min: 14, max: 19, name: 'Okay' },
  { min: 8, max: 13, name: 'Weak' },
  { min: 0, max: 7, name: 'Needs work' },
] as const

export type BandName = (typeof BANDS)[number]['name']

/** Forces one rubric score into the 0-5 whole-number range. */
export function clampScore(value: unknown): number {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return 0
  return Math.min(5, Math.max(0, n))
}

/** Cleans all six scores at once. */
export function normalizeScores(raw: Partial<Record<RubricKey, unknown>>): RubricScores {
  return RUBRIC_KEYS.reduce((acc, key) => {
    acc[key] = clampScore(raw[key])
    return acc
  }, {} as RubricScores)
}

/**
 * The total is always the six scores added up.
 * The AI is asked for a total too, but this is what the app trusts, so the
 * numbers on the card can never disagree with each other.
 */
export function totalOf(scores: RubricScores): number {
  return RUBRIC_KEYS.reduce((sum, key) => sum + scores[key], 0)
}

export function bandFor(total: number): BandName {
  const clamped = Math.min(30, Math.max(0, Math.round(total)))
  const band = BANDS.find((b) => clamped >= b.min && clamped <= b.max)
  return (band ?? BANDS[BANDS.length - 1]).name
}

/**
 * XP for finishing a debate.
 *
 * Everyone gets something for turning up, because giving up is the real
 * enemy. Doing well gives more, and a hard opponent gives more again.
 */
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

/** XP for a quiz: 5 for finishing, plus 3 per correct answer. */
export function xpForQuiz(score: number, total: number): number {
  if (total <= 0) return 0
  const correct = Math.min(Math.max(0, Math.round(score)), Math.round(total))
  return 5 + correct * 3
}

/** XP for a flashcard session: 1 per card reviewed, 2 if you got it right. */
export function xpForReviews(results: { correct: boolean }[]): number {
  return results.reduce((sum, r) => sum + (r.correct ? 2 : 1), 0)
}

/**
 * Turns one scorecard into the per-tag updates the Weakness Tracker needs.
 *
 * Each rubric part becomes its own tag (so "adab" can be weak on its own),
 * and every source the AI said to review becomes a tag too, carrying the
 * source score, since that is the part those sources would have helped.
 */
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

/** "Study next" list: weakest first, but only things tried at least once. */
export function studyNext<T extends { tag: string; attempts: number; avg_score: number }>(
  stats: T[],
  limit = 5,
): T[] {
  return [...stats]
    .filter((s) => s.attempts > 0)
    .sort((a, b) => a.avg_score - b.avg_score || b.attempts - a.attempts)
    .slice(0, limit)
}
