/** Small helpers for reading the research markdown files. */

/** Strips the `?claude-citation-...` junk that some URLs carry. */
export function cleanUrl(url: string): string {
  return url.replace(/\?claude-citation-[^)\s]*/gi, '').replace(/[),.;]+$/, '')
}

/**
 * Cleans inline `[Label](url)` links.
 *
 * Links carrying a `claude-citation` marker are website-name attributions
 * dropped into the middle of sentences (e.g. "... depends on it. [Thequran](...)").
 * Keeping the label leaves nonsense words in the prose, so those are removed
 * completely - the URL itself is still kept in each row's `urls` list.
 * Ordinary links keep their label and a cleaned URL.
 */
export function stripInlineLinks(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, url: string) =>
      /claude-citation/i.test(url) ? '' : `[${label}](${cleanUrl(url)})`,
    )
    // Tidy up the spacing left behind by a removed label.
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([.,;:!?])/g, '$1')
    .replace(/[ \t]+$/gm, '')
}

/** Removes the `---\nid: ...\n---` front matter at the top of a file. */
export function stripFrontMatter(md: string): string {
  return md.replace(/^---\n[\s\S]*?\n---\n/, '')
}

/** Every `https://...` in a block of text, cleaned and de-duplicated. */
export function collectUrls(text: string): string[] {
  const found = text.match(/https?:\/\/[^\s)<>\]]+/g) ?? []
  return [...new Set(found.map(cleanUrl))]
}

/** Turns "Problem of Evil — Logical Form" into "problem-of-evil-logical-form". */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function normalizeDifficulty(raw: string): 'easy' | 'medium' | 'hard' | 'expert' {
  const t = raw.toLowerCase()
  if (t.includes('expert')) return 'expert'
  if (t.includes('hard')) return 'hard'
  if (t.includes('easy')) return 'easy'
  return 'medium'
}

/**
 * Splits a file into `## ` sections.
 * Returns the heading text and the body under it.
 */
export function splitSections(md: string): { heading: string; body: string }[] {
  const out: { heading: string; body: string }[] = []
  const lines = stripFrontMatter(md).split('\n')
  let heading: string | null = null
  let buf: string[] = []

  for (const line of lines) {
    const h = /^##\s+(?!#)(.*)$/.exec(line)
    if (h) {
      if (heading !== null) out.push({ heading, body: buf.join('\n').trim() })
      heading = h[1].trim()
      buf = []
    } else if (heading !== null) {
      buf.push(line)
    }
  }
  if (heading !== null) out.push({ heading, body: buf.join('\n').trim() })
  return out
}

/**
 * Reads `**Label:** value` fields out of a section body.
 *
 * A field runs until the next `**Label:**` anywhere in the text, because some
 * lines hold two fields (e.g. "**Reacts well to:** ... **Reacts badly to:** ...").
 * Labels are lower-cased and stripped of anything in brackets, so
 * `**Steelman (say kindly):**` and `**Steelman:**` both become `steelman`.
 */
export function readFields(body: string): Map<string, string> {
  const fields = new Map<string, string>()
  const re = /\*\*([^*\n]+?):\*\*/g
  const hits: { key: string; from: number; to: number }[] = []

  let m: RegExpExecArray | null
  while ((m = re.exec(body)) !== null) {
    const key = m[1]
      .replace(/\([^)]*\)/g, '')
      .replace(/["“”]/g, '')
      .trim()
      .toLowerCase()
    if (key) hits.push({ key, from: m.index, to: m.index + m[0].length })
  }

  hits.forEach((hit, i) => {
    const stop = i + 1 < hits.length ? hits[i + 1].from : body.length
    const value = body
      .slice(hit.to, stop)
      .replace(/^\s*-\s*$/gm, '')
      .replace(/\n\s*-{3,}\s*$/, '')
      .trim()
      .replace(/\s*-{3,}\s*$/, '')
      .trim()
    // Keep the first one if a label somehow repeats.
    if (!fields.has(hit.key)) fields.set(hit.key, value)
  })

  return fields
}

/** Pulls `- item` bullets out of a block. */
export function readBullets(block: string): string[] {
  return block
    .split('\n')
    .map((l) => /^\s*[-*+]\s+(.*)$/.exec(l)?.[1]?.trim())
    .filter((v): v is string => Boolean(v))
}

/** Removes the surrounding quotes a field sometimes has. */
export function unquote(text: string): string {
  const t = text.trim()
  if (t.length > 1 && /^["“](.*)["”]$/s.test(t)) return t.replace(/^["“]|["”]$/g, '').trim()
  return t
}

/**
 * Finds content ids like ARG-2 / OBJ-11 / QA-3 inside a piece of text.
 * Persona ids (P1, P7) are NOT matched here on purpose: the arguments file
 * uses "P1:" and "P2:" as premise labels, which are a different thing.
 */
export function findIds(text: string): string[] {
  const found = text.match(/\b(?:ARG|OBJ|QA)-\d+\b/g) ?? []
  return [...new Set(found)]
}

/** Finds persona ids like P1 / P12. Use only on text that really means personas. */
export function findPersonaIds(text: string): string[] {
  const found = text.match(/\bP(\d{1,2})\b/g) ?? []
  return [...new Set(found.filter((id) => Number(id.slice(1)) >= 1 && Number(id.slice(1)) <= 12))]
}
