/**
 * Finds the research rows that matter for a question or a debate topic.
 *
 * This is deliberately simple: tag match first (ids like ARG-2 are exact),
 * then Postgres full-text search on the words of the question. Embeddings
 * could be added later without changing anything that calls this.
 */
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { RETRIEVAL_LIMIT } from './config.ts'

export interface ResearchRow {
  id: string
  kind: string
  slug: string
  title: string
  tags: string[]
  body_md: string
  difficulty: string
  meta: Record<string, unknown> | null
}

/** A client with the service role, used only for reading study material. */
export function serviceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('Supabase env vars are missing on the server.')
  return createClient(url, key, { auth: { persistSession: false } })
}

/** A client that acts AS the signed-in user, so RLS still applies. */
export function userClient(req: Request): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !key) throw new Error('Supabase env vars are missing on the server.')
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
}

/** Pulls ids like ARG-2 / OBJ-11 / QA-7 out of free text. */
export function idsIn(text: string): string[] {
  const found = text.toUpperCase().match(/\b(?:ARG|OBJ|QA)-\d+\b/g) ?? []
  return [...new Set(found)]
}

export async function findResearch(
  db: SupabaseClient,
  query: string,
  extraTags: string[] = [],
  limit = RETRIEVAL_LIMIT,
): Promise<ResearchRow[]> {
  const tags = [...new Set([...extraTags, ...idsIn(query)])]

  const { data, error } = await db.rpc('search_research', {
    p_query: query.slice(0, 500),
    p_tags: tags,
    p_kinds: null,
    p_limit: limit,
  })

  if (error) throw new Error(`Research search failed: ${error.message}`)
  return (data ?? []) as ResearchRow[]
}

/** Loads specific rows by slug or by id tag (ARG-2 and friends). */
export async function loadBySlugsOrCodes(
  db: SupabaseClient,
  keys: string[],
): Promise<ResearchRow[]> {
  if (!keys.length) return []
  const slugs = keys.filter((k) => !/^(ARG|OBJ|QA)-\d+$/i.test(k))
  const codes = keys.filter((k) => /^(ARG|OBJ|QA)-\d+$/i.test(k)).map((k) => k.toUpperCase())

  const results: ResearchRow[] = []

  if (slugs.length) {
    const { data } = await db.from('research_content').select('*').in('slug', slugs)
    results.push(...((data ?? []) as ResearchRow[]))
  }
  if (codes.length) {
    const { data } = await db.from('research_content').select('*').overlaps('tags', codes)
    results.push(...((data ?? []) as ResearchRow[]))
  }

  const seen = new Set<string>()
  return results.filter((r) => (seen.has(r.slug) ? false : (seen.add(r.slug), true)))
}
