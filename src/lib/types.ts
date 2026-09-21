/** Shared types for the whole app. Keep these in step with the SQL migration. */

export type ContentKind =
  | 'argument'
  | 'objection'
  | 'source'
  | 'qa'
  | 'persona'
  | 'glossary'

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

export interface ResearchContent {
  id: string
  kind: ContentKind
  slug: string
  title: string
  tags: string[]
  body_md: string
  difficulty: Difficulty
  /** Extra machine-readable fields (persona data, premises, urls...). */
  meta: Record<string, unknown> | null
}

export interface Profile {
  id: string
  display_name: string | null
  xp: number
  streak_count: number
  last_active_date: string | null
  level: number
}

export type DebateSide = 'muslim' | 'atheist'
export type MessageRole = 'user' | 'ai' | 'coach'

export interface Debate {
  id: string
  user_id: string
  persona_id: string
  difficulty: Difficulty
  topic: string | null
  user_plays_side: DebateSide
  created_at: string
  ended_at: string | null
}

export interface DebateMessage {
  id: string
  debate_id: string
  role: MessageRole
  content: string
  created_at: string
}

export interface Scorecard {
  id: string
  debate_id: string
  logic: number
  sources: number
  understanding: number
  clarity: number
  adab: number
  overclaim: number
  total: number
  strengths_md: string
  weaknesses_md: string
  better_answer_md: string
  sources_to_review: string[]
  created_at: string
}

export interface Citation {
  /** An id from docs/knowledge-map.md, e.g. "ARG-2" or "OBJ-6". */
  id: string
  /** Human label, e.g. "Quran 52:35-36" or "Sahih al-Bukhari 1358". */
  label: string
  url: string | null
}

export interface QaSession {
  id: string
  user_id: string
  question: string
  answer_md: string
  citations: Citation[]
  created_at: string
}

export interface Flashcard {
  id: string
  slug: string
  front: string
  back: string
  tags: string[]
}

export type ReviewResult = 'right' | 'wrong'

export interface FlashcardReview {
  id: string
  user_id: string
  flashcard_id: string
  ease: number
  next_review_date: string
  last_result: ReviewResult | null
  streak: number
}

export interface QuizResult {
  id: string
  user_id: string
  module: string
  score: number
  total: number
  created_at: string
}

export interface WeaknessStat {
  id: string
  user_id: string
  tag: string
  attempts: number
  avg_score: number
}

export interface Note {
  id: string
  user_id: string
  title: string
  body_md: string
  linked_slug: string | null
  created_at: string
}

/** The shape the persona rows keep in `meta`. */
export interface PersonaMeta {
  code: string // "P1"
  name: string // "Sara"
  role: string // "Curious Agnostic Student"
  personality: string
  style: string
  opening: string
  favourite_objections: string[] // ["OBJ-6", "OBJ-7"]
  reacts_well_to: string
  reacts_badly_to: string
  sensitive: boolean
  teaches?: string
}

/** The shape the argument rows keep in `meta`, used to draw the argument map. */
export interface ArgumentMeta {
  code: string // "ARG-2"
  simple: string
  premises: string[]
  conclusion: string
  objection: string
  reply: string
  avoid?: string
  urls: string[]
  scholars?: string
}

export interface ObjectionMeta {
  code: string // "OBJ-1"
  who?: string
  steelman: string
  response: string[]
  comeback?: string
  notes?: string
  urls: string[]
  linked_arguments: string[]
}
