/**
 * Reading the study material.
 *
 * The app reads content from the bundle that `npm run build:content` makes
 * from /research. It is the same data the seed script pushes to Supabase, so
 * the pages are instant, work with no internet, and can never drift from the
 * database. Supabase is used for the things that are personal to you
 * (progress, debates, notes) and by the edge functions on the server.
 */
import data from '../data/research.json'
import type { ContentKind, Difficulty } from './types'

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
  id: string
  level: number
  title: string
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
  key: string
  text: string
  correct: boolean
}

export interface QuizQuestion {
  id: string
  module: string
  question: string
  choices: QuizChoice[]
  explanation: string
  cites: string[]
  origin: '08' | 'derived'
}

export interface AllowList {
  quranRefs: string[]
  hadith: string[]
  islamqaIds: string[]
  urls: string[]
}

const research = data as unknown as {
  content: ContentRow[]
  flashcards: FlashcardRow[]
  levels: LevelDef[]
  quizzes: QuizQuestion[]
  allowList: AllowList
}

export const allContent: ContentRow[] = research.content
export const allFlashcards: FlashcardRow[] = research.flashcards
export const levels: LevelDef[] = research.levels
export const quizzes: QuizQuestion[] = research.quizzes
export const allowList: AllowList = research.allowList

const bySlug = new Map(allContent.map((row) => [row.slug, row]))
const byCode = new Map<string, ContentRow>()
for (const row of allContent) {
  const code = row.meta?.code
  if (typeof code === 'string') byCode.set(code.toUpperCase(), row)
}

export function getBySlug(slug: string): ContentRow | undefined {
  return bySlug.get(slug)
}

/** Finds a row by its id (ARG-2) or its slug (arg-kalam). */
export function getByKey(key: string): ContentRow | undefined {
  return byCode.get(key.toUpperCase()) ?? bySlug.get(key)
}

export function byKind(kind: ContentKind): ContentRow[] {
  return allContent.filter((row) => row.kind === kind)
}

export const argumentsList = byKind('argument')
export const objections = byKind('objection')
export const personas = byKind('persona')
export const qaBank = byKind('qa')
export const glossary = allContent
  .filter((row) => row.kind === 'glossary' && !row.tags.includes('fallacy'))
  .sort((a, b) => a.title.localeCompare(b.title))
export const fallacies = allContent.filter((row) => row.tags.includes('fallacy'))
export const sources = allContent.filter(
  (row) => row.kind === 'source' && !row.tags.includes('guide'),
)
export const guides = allContent.filter((row) => row.tags.includes('guide'))

/** The short code shown to the user, e.g. "ARG-2". Falls back to the slug. */
export function codeOf(row: ContentRow): string {
  const code = row.meta?.code
  return typeof code === 'string' ? code : row.slug
}

export function urlsOf(row: ContentRow): string[] {
  const urls = row.meta?.urls
  return Array.isArray(urls) ? (urls as string[]) : []
}

export function quizzesFor(moduleId: string): QuizQuestion[] {
  return quizzes.filter((q) => q.module === moduleId)
}

export function moduleById(id: string): ModuleDef | undefined {
  for (const level of levels) {
    const found = level.modules.find((m) => m.id === id)
    if (found) return found
  }
  return undefined
}

export const allModules: ModuleDef[] = levels.flatMap((l) => l.modules)

/** Simple text search over everything, for the search box. */
export function searchContent(query: string, limit = 20): ContentRow[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const words = q.split(/\s+/).filter(Boolean)

  return allContent
    .map((row) => {
      const haystack = `${row.title} ${row.tags.join(' ')} ${row.body_md}`.toLowerCase()
      let score = 0
      if (row.tags.some((t) => t.toLowerCase() === q)) score += 100
      if (row.slug === q) score += 100
      if (row.title.toLowerCase().includes(q)) score += 25
      for (const word of words) if (haystack.includes(word)) score += 1
      return { row, score }
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((hit) => hit.row)
}
