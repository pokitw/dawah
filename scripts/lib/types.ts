/** Types shared by the parser, the seed script and the offline data bundle. */

export type ContentKind =
  | 'argument'
  | 'objection'
  | 'source'
  | 'qa'
  | 'persona'
  | 'glossary'

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

export interface ContentRow {
  kind: ContentKind
  slug: string
  title: string
  tags: string[]
  body_md: string
  difficulty: Difficulty
  meta: Record<string, unknown>
}

export interface FlashcardRow {
  slug: string
  front: string
  back: string
  tags: string[]
}

export interface ModuleDef {
  id: string // "1.2"
  level: number
  title: string
  /** research_content slugs this module teaches, in order. */
  slugs: string[]
}

export interface LevelDef {
  level: number
  name: string
  goals: string
  modules: ModuleDef[]
  checkpoint: string
}

export interface QuizChoice {
  key: string // "A"
  text: string
  correct: boolean
}

export interface QuizQuestion {
  id: string
  module: string // "1.2" or "sample"
  question: string
  choices: QuizChoice[]
  explanation: string
  /** ids from the knowledge map this question comes from. */
  cites: string[]
  /** "08" = written in 08-learning-path.md; "derived" = built from 01-05. */
  origin: '08' | 'derived'
}

/** Every citation string the AI is allowed to use, taken from file 03. */
export interface SourceAllowList {
  quranRefs: string[]
  hadith: string[]
  islamqaIds: string[]
  urls: string[]
}

export interface ParsedResearch {
  content: ContentRow[]
  flashcards: FlashcardRow[]
  levels: LevelDef[]
  quizzes: QuizQuestion[]
  allowList: SourceAllowList
}
