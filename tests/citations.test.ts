/**
 * The honesty guarantee.
 *
 * The brief asks that the Q&A "never returns a citation not present in
 * research_content". These tests run the EXACT module the deployed edge
 * function uses (`supabase/functions/_shared/citations.ts`) against the
 * real parsed research data, feeding it the kinds of output a model
 * actually produces — including invented sources.
 */
import { describe, expect, it } from 'vitest'
import {
  allowedKeys,
  unsupportedNumbers,
  verifyCitations,
} from '../supabase/functions/_shared/citations.ts'
import research from '../src/data/research.json'

interface Row {
  kind: string
  slug: string
  title: string
  tags: string[]
  body_md: string
  difficulty: string
  meta: Record<string, unknown>
}

const allRows = (research as unknown as { content: Row[] }).content
/** Shaped like a row coming back from Postgres. */
const asDbRows = (rows: Row[]) =>
  rows.map((r) => ({ id: r.slug, ...r, meta: r.meta as Record<string, unknown> }))

const kalam = allRows.find((r) => r.slug === 'arg-kalam')!
const whoCreated = allRows.find((r) => r.slug === 'obj-who-created-god')!
const context = asDbRows([kalam, whoCreated])

describe('allowedKeys', () => {
  it('accepts the row slug, its id, and id tags', () => {
    const keys = allowedKeys(context)
    expect(keys.has('arg-kalam')).toBe(true)
    expect(keys.has('arg-2')).toBe(true)
    expect(keys.has('obj-6')).toBe(true)
  })

  it('does not accept an id that was not sent', () => {
    expect(allowedKeys(context).has('obj-13')).toBe(false)
  })
})

describe('verifyCitations keeps only real sources', () => {
  it('keeps a citation that is in the context', () => {
    const { kept, dropped } = verifyCitations(
      [{ id: 'ARG-2', label: 'Kalam argument', url: null }],
      context,
    )
    expect(kept).toHaveLength(1)
    expect(kept[0].id).toBe('ARG-2')
    expect(dropped).toEqual([])
  })

  it('DROPS an id that exists in the research but was not in the context', () => {
    // OBJ-13 is a real row, but the model was never shown it this time.
    const { kept, dropped } = verifyCitations(
      [{ id: 'OBJ-13', label: 'Hell and justice', url: null }],
      context,
    )
    expect(kept).toEqual([])
    expect(dropped).toEqual(['OBJ-13'])
  })

  it('DROPS a completely invented id', () => {
    const { kept, dropped } = verifyCitations(
      [{ id: 'ARG-99', label: 'The invented argument', url: 'https://evil.example' }],
      context,
    )
    expect(kept).toEqual([])
    expect(dropped).toEqual(['ARG-99'])
  })

  it('keeps the good ones and drops the bad ones in the same answer', () => {
    const { kept, dropped } = verifyCitations(
      [
        { id: 'ARG-2', label: 'Kalam', url: null },
        { id: 'ARG-99', label: 'Made up', url: null },
        { id: 'OBJ-6', label: 'Who created God', url: null },
        { id: 'OBJ-404', label: 'Also made up', url: null },
      ],
      context,
    )
    expect(kept.map((c) => c.id).sort()).toEqual(['ARG-2', 'OBJ-6'])
    expect(dropped.sort()).toEqual(['ARG-404'.replace('ARG', 'OBJ'), 'ARG-99'].sort())
  })

  it('replaces a made-up URL with one the database really holds', () => {
    const { kept } = verifyCitations(
      [{ id: 'OBJ-6', label: 'Who created God', url: 'https://phishing.example/fake' }],
      context,
    )
    expect(kept[0].url).not.toBe('https://phishing.example/fake')
    expect(kept[0].url).toMatch(/^https:\/\/(islamqa\.info|sunnah\.com)/)
  })

  it('keeps a URL that the row genuinely has', () => {
    const real = (whoCreated.meta.urls as string[])[1]
    const { kept } = verifyCitations([{ id: 'OBJ-6', label: 'x', url: real }], context)
    expect(kept[0].url).toBe(real)
  })

  it('is not case sensitive about ids', () => {
    expect(verifyCitations([{ id: 'arg-2', label: 'x', url: null }], context).kept).toHaveLength(1)
  })

  it('de-duplicates when the model repeats a source', () => {
    const { kept } = verifyCitations(
      [
        { id: 'ARG-2', label: 'x', url: null },
        { id: 'arg-kalam', label: 'same row', url: null },
      ],
      context,
    )
    expect(kept).toHaveLength(1)
  })

  it('survives rubbish instead of a list', () => {
    expect(verifyCitations(null, context).kept).toEqual([])
    expect(verifyCitations('ARG-2', context).kept).toEqual([])
    expect(verifyCitations([null, 42, {}, { id: '' }], context).kept).toEqual([])
  })

  it('returns nothing when the context was empty', () => {
    const { kept, dropped } = verifyCitations([{ id: 'ARG-2', label: 'x', url: null }], [])
    expect(kept).toEqual([])
    expect(dropped).toEqual(['ARG-2'])
  })

  it('never returns an id that is not a real slug or code anywhere', () => {
    const everySlug = new Set(allRows.map((r) => r.slug.toLowerCase()))
    const everyCode = new Set(
      allRows.map((r) => String(r.meta?.code ?? '').toLowerCase()).filter(Boolean),
    )

    const wholeLibrary = asDbRows(allRows)
    const { kept } = verifyCitations(
      [
        ...allRows.slice(0, 30).map((r) => ({ id: r.slug, label: r.title, url: null })),
        { id: 'TOTALLY-FAKE', label: 'nope', url: null },
        { id: 'Quran 99:99', label: 'nope', url: null },
      ],
      wholeLibrary,
    )

    for (const citation of kept) {
      const key = citation.id.toLowerCase()
      expect(everySlug.has(key) || everyCode.has(key)).toBe(true)
    }
    expect(kept.some((c) => c.id === 'TOTALLY-FAKE')).toBe(false)
  })
})

describe('unsupportedNumbers spots invented references in the prose', () => {
  it('says nothing when every number is in the context', () => {
    expect(unsupportedNumbers('Whatever begins to exist has a cause.', context)).toEqual([])
  })

  it('flags a Quran reference that is not in the context', () => {
    const found = unsupportedNumbers('As Allah says in Quran 99:12, ...', context)
    expect(found).toContain('Quran 99:12')
  })

  it('flags a hadith number that is not in the context', () => {
    const found = unsupportedNumbers('This is in Bukhari 9999.', context)
    expect(found.some((f) => /9999/.test(f))).toBe(true)
  })

  it('flags an islamqa id that is not in the context', () => {
    const found = unsupportedNumbers('See islamqa 1234567 for this.', context)
    expect(found.some((f) => /1234567/.test(f))).toBe(true)
  })

  it('accepts a hadith number that IS in the context', () => {
    // OBJ-6 quotes Bukhari 3276 and Muslim 134.
    expect(unsupportedNumbers('See Sahih al-Bukhari 3276.', context)).toEqual([])
  })
})

describe('the research bundle itself is sound', () => {
  const data = research as unknown as {
    content: Row[]
    flashcards: { slug: string; front: string; back: string }[]
    quizzes: { id: string; cites: string[]; choices: { correct: boolean }[] }[]
    allowList: { quranRefs: string[]; hadith: string[]; islamqaIds: string[]; urls: string[] }
  }

  it('has every id from the knowledge map', () => {
    const codes = new Set(data.content.map((r) => String(r.meta?.code ?? '')))
    for (let i = 1; i <= 7; i++) expect(codes.has(`ARG-${i}`)).toBe(true)
    for (let i = 1; i <= 17; i++) expect(codes.has(`OBJ-${i}`)).toBe(true)
    for (let i = 1; i <= 12; i++) expect(codes.has(`P${i}`)).toBe(true)
    for (let i = 1; i <= 62; i++) expect(codes.has(`QA-${i}`)).toBe(true)
  })

  it('has no duplicate slugs', () => {
    const slugs = data.content.map((r) => r.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('has no empty bodies', () => {
    expect(data.content.filter((r) => !r.body_md.trim())).toEqual([])
  })

  it('has no leftover citation-link junk in any body', () => {
    const junk = data.content.filter((r) => /claude-citation/i.test(r.body_md))
    expect(junk.map((r) => r.slug)).toEqual([])
  })

  it('gives every quiz question exactly one correct answer', () => {
    for (const q of data.quizzes) {
      expect(q.choices.filter((c) => c.correct)).toHaveLength(1)
    }
  })

  it('points every quiz citation at a row that exists', () => {
    const keys = new Set([
      ...data.content.map((r) => r.slug),
      ...data.content.map((r) => String(r.meta?.code ?? '')).filter(Boolean),
    ])
    for (const q of data.quizzes) {
      for (const cite of q.cites) expect(keys.has(cite)).toBe(true)
    }
  })

  it('has both sides of every flashcard', () => {
    for (const card of data.flashcards) {
      expect(card.front.trim().length).toBeGreaterThan(0)
      expect(card.back.trim().length).toBeGreaterThan(0)
    }
  })

  it('carries the allow-list from file 03', () => {
    expect(data.allowList.quranRefs).toContain('67:2')
    expect(data.allowList.quranRefs).toContain('30:30')
    expect(data.allowList.hadith).toContain('Sahih al-Bukhari 3276')
    expect(data.allowList.hadith).toContain('Sahih Muslim 2658')
    expect(data.allowList.islamqaIds).toContain('26745')
    expect(data.allowList.urls.some((u) => u.includes('sunnah.com/bukhari:3276'))).toBe(true)
  })

  it('keeps the honesty flags, which the AI must obey', () => {
    const flags = data.content.filter((r) => r.tags.includes('honesty-flag'))
    expect(flags).toHaveLength(3)
    expect(flags.some((f) => /Amantu billah/i.test(f.body_md))).toBe(true)
    expect(flags.some((f) => /scientific miracles/i.test(f.body_md))).toBe(true)
  })
})
