/**
 * Saving progress: XP, streaks, quiz results and flashcard reviews.
 *
 * Every one of these is best-effort. If the network is down, the user still
 * gets to finish the lesson — they just do not earn the XP. Losing a point
 * is better than losing the work.
 */
import { supabase } from './supabase'
import type { Profile } from './types'
import type { ReviewState } from './srs'
import { newCardState } from './srs'
import { todayISO } from './format'

export async function awardXp(xp: number): Promise<Profile | null> {
  if (!supabase || xp <= 0) return null
  const { data, error } = await supabase.rpc('record_activity', { p_xp: Math.round(xp) })
  if (error) return null
  return data as Profile
}

export async function saveQuizResult(
  userId: string,
  module: string,
  score: number,
  total: number,
): Promise<void> {
  if (!supabase) return
  await supabase.from('quiz_results').insert({ user_id: userId, module, score, total })
}

/** Loads the review state for every card this user has seen. */
export async function loadReviewStates(
  userId: string,
): Promise<Map<string, ReviewState & { flashcard_id: string }>> {
  const out = new Map<string, ReviewState & { flashcard_id: string }>()
  if (!supabase) return out

  const { data } = await supabase
    .from('flashcard_reviews')
    .select('flashcard_id, streak, ease, next_review_date, last_result, flashcards(slug)')
    .eq('user_id', userId)

  for (const row of data ?? []) {
    const slug = (row as { flashcards?: { slug?: string } }).flashcards?.slug
    if (!slug) continue
    out.set(slug, {
      flashcard_id: (row as { flashcard_id: string }).flashcard_id,
      streak: (row as { streak: number }).streak,
      ease: (row as { ease: number }).ease,
      next_review_date: (row as { next_review_date: string }).next_review_date,
      last_result: (row as { last_result: ReviewState['last_result'] }).last_result,
    })
  }
  return out
}

/** Looks up the database ids for a set of card slugs. */
export async function flashcardIds(slugs: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  if (!supabase || !slugs.length) return out
  const { data } = await supabase.from('flashcards').select('id, slug').in('slug', slugs)
  for (const row of data ?? []) {
    out.set((row as { slug: string }).slug, (row as { id: string }).id)
  }
  return out
}

export async function saveReview(
  userId: string,
  flashcardId: string,
  state: ReviewState,
): Promise<void> {
  if (!supabase) return
  await supabase.from('flashcard_reviews').upsert(
    {
      user_id: userId,
      flashcard_id: flashcardId,
      streak: state.streak,
      ease: state.ease,
      next_review_date: state.next_review_date,
      last_result: state.last_result,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,flashcard_id' },
  )
}

export function stateFor(
  states: Map<string, ReviewState & { flashcard_id: string }>,
  slug: string,
): ReviewState {
  return states.get(slug) ?? newCardState(todayISO())
}

export interface WeaknessRow {
  tag: string
  attempts: number
  avg_score: number
}

export async function loadWeakness(userId: string): Promise<WeaknessRow[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('weakness_stats')
    .select('tag, attempts, avg_score')
    .eq('user_id', userId)
  return (data ?? []) as WeaknessRow[]
}

export interface QuizHistoryRow {
  module: string
  score: number
  total: number
  created_at: string
}

export async function loadQuizHistory(userId: string): Promise<QuizHistoryRow[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('quiz_results')
    .select('module, score, total, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []) as QuizHistoryRow[]
}

/** Which modules the user has passed (70% or better on the quiz). */
export function passedModules(history: QuizHistoryRow[]): Set<string> {
  const passed = new Set<string>()
  for (const row of history) {
    if (row.total > 0 && row.score / row.total >= 0.7) passed.add(row.module)
  }
  return passed
}
