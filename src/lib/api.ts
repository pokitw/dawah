/**
 * Calls the Supabase edge functions.
 *
 * The Anthropic key never appears here. The browser only ever talks to our
 * own server functions, which hold the key.
 */
import { requireSupabase } from './supabase'
import type { Citation, Difficulty, DebateSide, MessageRole } from './types'

async function invoke<T>(name: string, payload: Record<string, unknown>): Promise<T> {
  const supabase = requireSupabase()
  const { data, error } = await supabase.functions.invoke(name, { body: payload })

  if (error) {
    // Edge functions send a readable `error` string; surface it as-is.
    const fromBody = (data as { error?: string } | null)?.error
    throw new Error(fromBody ?? error.message ?? 'The server had a problem.')
  }
  if ((data as { error?: string } | null)?.error) {
    throw new Error((data as { error: string }).error)
  }
  return data as T
}

// ----------------------------------------------------------------- ask ---

export interface AskResponse {
  answer_md: string
  citations: Citation[]
  confidence: 'answered' | 'unsure' | 'scholars-differ'
  strength: 'strong-mainstream' | 'weak-avoid' | 'not-applicable'
  safetyPause: boolean
  warnings: string[]
  usedSources?: { id: string; slug: string; title: string; kind: string }[]
}

export function askQuestion(input: {
  question: string
  explainSimpler?: boolean
  previousAnswer?: string
  save?: boolean
}): Promise<AskResponse> {
  return invoke<AskResponse>('ask-qa', { ...input })
}

// -------------------------------------------------------------- debate ---

export interface DebateTurnResponse {
  reply: string
  safetyPause: boolean
  warnings: string[]
}

export function debateTurn(input: {
  debateId: string
  personaSlug: string
  difficulty: Difficulty
  topic: string | null
  userPlaysSide: DebateSide
  message: string
  history: { role: MessageRole; content: string }[]
}): Promise<DebateTurnResponse> {
  return invoke<DebateTurnResponse>('debate-turn', { ...input })
}

export function coachHint(input: {
  personaSlug: string
  topic: string | null
  userPlaysSide: DebateSide
  history: { role: MessageRole; content: string }[]
  draft?: string
}): Promise<{ hint: string }> {
  return invoke<{ hint: string }>('coach-hint', { ...input })
}

export interface ScoreResponse {
  logic: number
  sources: number
  understanding: number
  clarity: number
  adab: number
  overclaim: number
  total: number
  band: string
  strengths_md: string
  weaknesses_md: string
  better_answer_md: string
  sources_to_review: string[]
  xpAwarded: number
}

export function scoreDebate(input: { debateId: string }): Promise<ScoreResponse> {
  return invoke<ScoreResponse>('score-debate', { ...input })
}
