/**
 * The honesty guard.
 *
 * The model is told to cite only from the research context. This checks that
 * it actually did, and quietly drops anything it made up. A citation the app
 * shows must always point at a row that really exists.
 */
import type { ResearchRow } from './retrieval.ts'

export interface Citation {
  /** The id from docs/knowledge-map.md, e.g. "ARG-2", or the row slug. */
  id: string
  /** What to show the reader, e.g. "Quran 52:35-36". */
  label: string
  url: string | null
}

/** Every id and slug the model was actually given. */
export function allowedKeys(rows: ResearchRow[]): Set<string> {
  const keys = new Set<string>()
  for (const row of rows) {
    keys.add(row.slug.toLowerCase())
    const code = (row.meta as { code?: string } | null)?.code
    if (code) keys.add(code.toLowerCase())
    for (const tag of row.tags ?? []) {
      if (/^(ARG|OBJ|QA)-\d+$/i.test(tag)) keys.add(tag.toLowerCase())
    }
  }
  return keys
}

/**
 * Keeps only citations that point at a row we really sent, and replaces the
 * model's URL with the one stored in the database, so a made-up link can
 * never reach the page.
 */
export function verifyCitations(
  raw: unknown,
  rows: ResearchRow[],
): { kept: Citation[]; dropped: string[] } {
  const allowed = allowedKeys(rows)
  const byKey = new Map<string, ResearchRow>()
  for (const row of rows) {
    byKey.set(row.slug.toLowerCase(), row)
    const code = (row.meta as { code?: string } | null)?.code
    if (code) byKey.set(code.toLowerCase(), row)
    for (const tag of row.tags ?? []) {
      if (/^(ARG|OBJ|QA)-\d+$/i.test(tag)) byKey.set(tag.toLowerCase(), row)
    }
  }

  const kept: Citation[] = []
  const dropped: string[] = []
  const seen = new Set<string>()

  for (const item of Array.isArray(raw) ? raw : []) {
    const id = String((item as { id?: unknown })?.id ?? '').trim()
    if (!id) continue

    const key = id.toLowerCase()
    if (!allowed.has(key)) {
      dropped.push(id)
      continue
    }

    const row = byKey.get(key)
    // De-duplicate by the ROW, not by the text. "ARG-2" and "arg-kalam" are
    // two names for one source and must not be listed twice.
    const identity = row ? row.slug.toLowerCase() : key
    if (seen.has(identity)) continue
    seen.add(identity)
    const urls = (row?.meta as { urls?: string[] } | null)?.urls ?? []
    const claimed = String((item as { url?: unknown })?.url ?? '')
    // Only allow a URL the database actually holds for this row.
    const url = urls.includes(claimed) ? claimed : (urls[0] ?? null)

    kept.push({
      id: row ? ((row.meta as { code?: string } | null)?.code ?? row.slug) : id,
      label: String((item as { label?: unknown })?.label ?? row?.title ?? id).slice(0, 200),
      url,
    })
  }

  return { kept, dropped }
}

/**
 * Looks for verse / hadith numbers in the answer text that were not in the
 * context. Used to add an honest warning rather than to block the answer.
 */
export function unsupportedNumbers(answer: string, rows: ResearchRow[]): string[] {
  const haystack = rows.map((r) => `${r.title}\n${r.body_md}`).join('\n').toLowerCase()
  const suspects = new Set<string>()

  // "Quran 12:34" / "12:34"
  for (const m of answer.matchAll(/\b(\d{1,3}:\d{1,3})(?:\s*[-–]\s*\d{1,3})?\b/g)) {
    const ref = m[1]
    if (!haystack.includes(ref)) suspects.add(`Quran ${ref}`)
  }
  // "Bukhari 1358", "Muslim 2658", "Tirmidhi 2139"
  for (const m of answer.matchAll(
    /\b(bukhari|muslim|tirmidhi|abu dawud|nasa'i|ibn majah)\s*:?\s*(\d{1,5})\b/gi,
  )) {
    if (!haystack.includes(m[2])) suspects.add(`${m[1]} ${m[2]}`)
  }
  // "islamqa 12345"
  for (const m of answer.matchAll(/islamqa[^\d]{0,12}(\d{3,7})/gi)) {
    if (!haystack.includes(m[1])) suspects.add(`islamqa ${m[1]}`)
  }

  return [...suspects]
}
