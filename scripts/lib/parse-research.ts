/**
 * Turns the markdown in /research into rows the app can use.
 *
 * Nothing here invents content. Every row is built from text that is
 * actually in the files, so the AI can only ever quote what the
 * knowledge base really says.
 */
import { derivedQuizzes, SAMPLE_QUIZ_MODULES } from './quiz-bank.ts'
import type {
  ContentRow,
  Difficulty,
  FlashcardRow,
  LevelDef,
  ModuleDef,
  ParsedResearch,
  QuizQuestion,
  SourceAllowList,
} from './types.ts'
import {
  collectUrls,
  findIds,
  findPersonaIds,
  normalizeDifficulty,
  readBullets,
  readFields,
  slugify,
  splitSections,
  stripInlineLinks,
  unquote,
} from './md.ts'

export interface ResearchFiles {
  index: string // 00
  arguments: string // 01
  objections: string // 02
  sources: string // 03
  philosophy: string // 04
  method: string // 05
  personas: string // 06
  qa: string // 07
  learning: string // 08
  features: string // 09
}

// ------------------------------------------------------------------ 01 ---

function parseArguments(md: string): ContentRow[] {
  const rows: ContentRow[] = []

  for (const { heading, body } of splitSections(md)) {
    const head = /^(ARG-\d+):\s*(.*)$/.exec(heading)
    if (!head) continue

    const code = head[1]
    const title = head[2].trim()
    const f = readFields(body)

    const slug = (f.get('id') ?? slugify(title)).split('|')[0].trim()
    const difficulty = normalizeDifficulty(f.get('difficulty') ?? 'medium')
    const simple = stripInlineLinks(f.get('simple') ?? '')
    const premises = readBullets(f.get('formal steps') ?? '').map(stripInlineLinks)
    const conclusion = premises.find((p) => /^C[:.]/.test(p)) ?? ''
    const objection = unquote(stripInlineLinks(f.get('strongest atheist objection') ?? ''))
    const reply = stripInlineLinks(f.get('best islamic reply') ?? '')
    const avoid = stripInlineLinks(f.get('weak version to avoid') ?? '')
    const scholars = [f.get('classical scholars'), f.get('classical scholar')]
      .filter(Boolean)
      .map((s) => stripInlineLinks(s as string))
      .join(' ')
    const scripture = [f.get('quran/sunnah'), f.get('quran'), f.get('hadith')]
      .filter(Boolean)
      .map((s) => stripInlineLinks(s as string))
      .join('\n')
    const urls = collectUrls(body)

    const parts: string[] = []
    if (simple) parts.push(`**In simple words**\n\n${simple}`)
    if (premises.length) {
      parts.push(`**The steps**\n\n${premises.map((p) => `- ${p}`).join('\n')}`)
    }
    if (scripture) parts.push(`**From the Quran and Sunnah**\n\n${scripture}`)
    if (scholars) parts.push(`**Scholars**\n\n${scholars}`)
    if (objection) parts.push(`**Strongest atheist objection**\n\n${objection}`)
    if (reply) parts.push(`**Best Islamic reply**\n\n${reply}`)
    if (avoid) parts.push(`**Weak version to AVOID**\n\n${avoid}`)

    rows.push({
      kind: 'argument',
      slug,
      title: `${code}: ${title}`,
      tags: [code, 'argument', difficulty, ...findIds(objection + ' ' + reply)],
      body_md: parts.join('\n\n'),
      difficulty,
      meta: {
        code,
        simple,
        premises: premises.filter((p) => !/^C[:.]/.test(p)),
        conclusion,
        objection,
        reply,
        avoid: avoid || undefined,
        scholars,
        urls,
      },
    })
  }

  return rows
}

// ------------------------------------------------------------------ 02 ---

function parseObjections(md: string): ContentRow[] {
  const rows: ContentRow[] = []

  for (const { heading, body } of splitSections(md)) {
    const head = /^(OBJ-\d+):\s*(.*)$/.exec(heading)
    if (!head) continue

    const code = head[1]
    const title = head[2].trim()
    const f = readFields(body)

    const slug = (f.get('id') ?? slugify(title)).split('|')[0].trim()
    const rawDifficulty = f.get('difficulty') ?? 'medium'
    const difficulty: Difficulty = /mixed/i.test(rawDifficulty)
      ? 'hard'
      : normalizeDifficulty(rawDifficulty)
    const who = (f.get('who') ?? '').split('|')[0].trim()
    const steelman = stripInlineLinks(f.get('steelman') ?? '')
    const responseRaw = f.get('islamic response') ?? f.get('islamic response the') ?? ''
    const responseBullets = readBullets(responseRaw).map(stripInlineLinks)
    const response = responseBullets.length
      ? responseBullets
      : [stripInlineLinks(responseRaw)].filter(Boolean)
    const comeback = unquote(stripInlineLinks(f.get('likely comeback') ?? ''))
    const notes = stripInlineLinks(f.get('notes') ?? '')
    const urls = collectUrls(body)

    const parts: string[] = []
    if (steelman) parts.push(`**The objection, said fairly (steelman)**\n\n${steelman}`)
    if (response.length) {
      parts.push(`**Islamic response**\n\n${response.map((r) => `- ${r}`).join('\n')}`)
    }
    if (comeback) parts.push(`**Likely comeback**\n\n${comeback}`)
    if (notes) parts.push(`**Notes on strong vs weak answers**\n\n${notes}`)

    rows.push({
      kind: 'objection',
      slug,
      title: `${code}: ${title}`,
      tags: [
        code,
        'objection',
        difficulty,
        ...findIds(notes + ' ' + response.join(' ')),
      ],
      body_md: parts.join('\n\n'),
      difficulty,
      meta: {
        code,
        who: who || undefined,
        steelman,
        response,
        comeback: comeback || undefined,
        notes: notes || undefined,
        urls,
        linked_arguments: findIds(notes + ' ' + response.join(' ')).filter((i) =>
          i.startsWith('ARG'),
        ),
      },
    })
  }

  return rows
}

// ------------------------------------------------------------------ 06 ---

function parsePersonas(md: string): ContentRow[] {
  const rows: ContentRow[] = []

  for (const { heading, body } of splitSections(md)) {
    const head = /^(P\d{1,2})\s*[—–-]\s*(.*)$/.exec(heading)
    if (!head) continue

    const code = head[1]
    const label = head[2].trim()
    // `Curious Agnostic Student ("Sara")` -> role + name.
    // `Existentialist / Nihilist ("Camus fan, Leo")` -> the name is after the comma.
    const nameMatch = /\(["“]?([^)"”]+)["”]?\)\s*$/.exec(label)
    const name = nameMatch
      ? (nameMatch[1].split(',').pop() as string).trim()
      : label
    const role = label.replace(/\s*\([^)]*\)\s*$/, '').trim()

    const f = readFields(body)
    const difficulty = normalizeDifficulty(f.get('difficulty') ?? 'medium')
    const favourite =
      f.get('favorite arguments') ?? f.get('favourite arguments') ?? f.get('favorite') ?? ''
    const favouriteIds = findIds(favourite).filter((i) => i.startsWith('OBJ'))
    const safety = f.get('safety') ?? ''

    const meta = {
      code,
      name,
      role,
      personality: f.get('personality') ?? '',
      style: f.get('style') ?? '',
      opening: unquote(f.get('opening') ?? ''),
      favourite_objections: favouriteIds,
      favourite_raw: favourite.trim(),
      reacts_well_to: f.get('reacts well to') ?? '',
      reacts_badly_to: f.get('reacts badly to') ?? '',
      purpose: f.get('purpose') ?? '',
      teaches: f.get('teaches') ?? '',
      safety,
      sensitive: Boolean(safety) || /sensitive/i.test(f.get('difficulty') ?? ''),
    }

    const parts = [
      `**Who they are**\n\n${meta.role}${meta.personality ? ` — ${meta.personality}` : ''}`,
      meta.style ? `**How they talk**\n\n${meta.style}` : '',
      meta.opening ? `**They usually open with**\n\n"${meta.opening}"` : '',
      favouriteIds.length ? `**Their favourite objections**\n\n${favouriteIds.join(', ')}` : '',
      meta.reacts_well_to ? `**Reacts well to**\n\n${meta.reacts_well_to}` : '',
      meta.reacts_badly_to ? `**Reacts badly to**\n\n${meta.reacts_badly_to}` : '',
      meta.purpose ? `**Why practice with them**\n\n${meta.purpose}` : '',
      meta.teaches ? `**What this teaches**\n\n${meta.teaches}` : '',
      safety ? `**Safety note**\n\n${safety}` : '',
    ].filter(Boolean)

    rows.push({
      kind: 'persona',
      slug: `${code.toLowerCase()}-${slugify(name)}`,
      title: `${code} — ${label}`,
      tags: [code, 'persona', difficulty, ...favouriteIds],
      body_md: parts.join('\n\n'),
      difficulty,
      meta,
    })
  }

  return rows
}

/** The 0-5 rubric and the bands, read out of the same file. */
function parseRubric(md: string): ContentRow | null {
  const section = splitSections(md).find((s) => /SCORING RUBRIC/i.test(s.heading))
  if (!section) return null
  return {
    kind: 'source',
    slug: 'rubric-scoring',
    title: 'How debates are scored (0–5 each, total /30)',
    tags: ['rubric', 'guide', 'scoring'],
    body_md: stripInlineLinks(section.body),
    difficulty: 'easy',
    meta: { from: '06-roleplay-personas.md' },
  }
}

// ------------------------------------------------------------------ 07 ---

function parseQaBank(md: string): ContentRow[] {
  const rows: ContentRow[] = []

  for (const { heading, body } of splitSections(md)) {
    if (/^Format/i.test(heading)) continue
    const group = heading.trim()

    for (const line of body.split('\n')) {
      const m = /^\s*(\d+)\.\s+(.*)$/.exec(line)
      if (!m) continue

      const num = m[1]
      const rest = stripInlineLinks(m[2].trim())
      const arrow = rest.indexOf('→')
      if (arrow === -1) continue

      const question = rest.slice(0, arrow).trim()
      const tail = rest.slice(arrow + 1).trim()

      // The tail is: answer | source ids | difficulty
      const pipes = tail.split('|').map((p) => p.trim())
      const difficulty =
        pipes.length >= 2 ? normalizeDifficulty(pipes[pipes.length - 1]) : 'medium'
      const sourceField = pipes.length >= 3 ? pipes[pipes.length - 2] : ''
      const answer = (pipes.length >= 3 ? pipes.slice(0, -2) : pipes.slice(0, 1))
        .join(' | ')
        .trim()

      const ids = findIds(sourceField)

      rows.push({
        kind: 'qa',
        slug: `qa-${num}`,
        title: question,
        tags: [`QA-${num}`, 'qa', difficulty, slugify(group), ...ids],
        body_md: `**Question**\n\n${question}\n\n**Short answer**\n\n${answer}${
          sourceField ? `\n\n**Where this comes from**\n\n${sourceField}` : ''
        }`,
        difficulty,
        meta: { code: `QA-${num}`, group, question, answer, cites: ids, raw_sources: sourceField },
      })
    }
  }

  return rows
}

// ------------------------------------------------------------ 00 and 04 ---

function parseGlossary(md: string): ContentRow[] {
  const section = splitSections(md).find((s) => /Glossary/i.test(s.heading))
  if (!section) return []

  return readBullets(section.body)
    .map((line): ContentRow | null => {
      const m = /^\*\*([^*]+)\*\*\s*[—–-]\s*(.*)$/.exec(line)
      if (!m) return null
      const term = m[1].trim()
      const definition = stripInlineLinks(m[2].trim())
      return {
        kind: 'glossary' as const,
        slug: `glossary-${slugify(term)}`,
        title: term,
        tags: ['glossary', 'word'],
        body_md: definition,
        difficulty: 'easy' as const,
        meta: { term, definition },
      }
    })
    .filter((r): r is ContentRow => r !== null)
}

function parseFallacies(md: string): ContentRow[] {
  const section = splitSections(md).find((s) => /Common Fallacies/i.test(s.heading))
  if (!section) return []

  return readBullets(section.body)
    .map((line): ContentRow | null => {
      const m = /^\*\*([^*]+)\*\*\s*[—–-]\s*(.*)$/.exec(line)
      if (!m) return null
      const term = m[1].trim()
      const rest = stripInlineLinks(m[2].trim())
      // "twisting the other side. (Atheist: "...")" -> definition + example.
      // The example is the bracket that STARTS A NEW SENTENCE, so brackets
      // inside the definition itself (is/ought quotes "is" / "ought") are kept.
      const sentenceEnd = /[.!?\u201d"]\s+\(/.exec(rest)
      const exampleAt = sentenceEnd ? sentenceEnd.index + sentenceEnd[0].length - 1 : -1
      const definition = (exampleAt > 0 ? rest.slice(0, exampleAt) : rest).trim()
      const example = exampleAt > 0 ? rest.slice(exampleAt).trim() : ''
      return {
        kind: 'glossary' as const,
        slug: `fallacy-${slugify(term)}`,
        title: term,
        tags: ['fallacy', 'logic', 'glossary'],
        body_md: `${definition}${example ? `\n\n**Example:** ${example}` : ''}`,
        difficulty: 'easy' as const,
        meta: { term, definition, example, isFallacy: true },
      }
    })
    .filter((r): r is ContentRow => r !== null)
}

/** Sections of 04 and 05 become short lessons the Learn tab can render. */
function parseGuides(philosophy: string, method: string): ContentRow[] {
  const rows: ContentRow[] = []

  const take = (md: string, file: string, tag: string, skip: RegExp) => {
    for (const { heading, body } of splitSections(md)) {
      if (skip.test(heading)) continue
      const title = heading.replace(/^\d+\)\s*/, '').trim()
      if (!title || !body.trim()) continue
      // Drop "(very important)" style asides from the slug, keep them in the title.
      const slugText = title.replace(/\([^)]*\)/g, '').replace(/[?!]+\s*$/, '').trim()
      rows.push({
        kind: 'source',
        slug: `guide-${slugify(slugText)}`,
        title,
        tags: ['guide', tag, 'lesson'],
        body_md: stripInlineLinks(body.trim()),
        difficulty: 'easy',
        meta: { from: file, section: heading },
      })
    }
  }

  take(philosophy, '04-philosophy-basics.md', 'logic', /Common Fallacies/i)
  take(method, '05-dawah-method.md', 'dawah', /^$/)
  return rows
}

// ------------------------------------------------------------------ 03 ---

const SOURCE_SECTIONS: { match: RegExp; tag: string; prefix: string }[] = [
  { match: /Key Quran Verses/i, tag: 'quran', prefix: 'src-quran' },
  { match: /Key Hadith/i, tag: 'hadith', prefix: 'src-hadith' },
  { match: /islamqa\.info Answers/i, tag: 'fatwa', prefix: 'src-islamqa' },
  { match: /Yaqeen Institute Papers/i, tag: 'paper', prefix: 'src-yaqeen' },
  { match: /Sapience Institute/i, tag: 'paper', prefix: 'src-sapience' },
  { match: /Neutral \/ Academic/i, tag: 'academic', prefix: 'src-academic' },
  { match: /Classical Books/i, tag: 'book', prefix: 'src-book' },
  { match: /Honesty Flags/i, tag: 'honesty-flag', prefix: 'src-flag' },
]

function parseSources(md: string): ContentRow[] {
  const rows: ContentRow[] = []
  const used = new Set<string>()

  for (const { heading, body } of splitSections(md)) {
    const spec = SOURCE_SECTIONS.find((s) => s.match.test(heading))
    if (!spec) continue

    readBullets(body).forEach((bullet, i) => {
      const text = stripInlineLinks(bullet)
      const bold = /^\*\*([^*]+?)\*\*/.exec(text)
      // Bullets are written three ways: "**Label:** ...", "Title — url", and
      // plain prose like "Stanford Encyclopedia (SEP): entry, entry, entry".
      const label = bold
        ? bold[1].replace(/[:：]\s*$/, '').trim()
        : (text.includes(' — ') || text.includes(' – ')
            ? text.split(/\s+[—–]\s+/)[0]
            : text.split(':')[0]
          )
            .replace(/^\*+|\*+$/g, '')
            .trim()

      let slug = `${spec.prefix}-${slugify(label)}`
      if (!slug.replace(spec.prefix + '-', '')) slug = `${spec.prefix}-${i + 1}`
      while (used.has(slug)) slug = `${slug}-b`
      used.add(slug)

      rows.push({
        kind: 'source',
        slug,
        title: label.slice(0, 120),
        tags: ['source', spec.tag],
        body_md: text,
        difficulty: 'easy',
        // `raw` is not stored: body_md already holds the same text.
        meta: {
          section: heading,
          urls: collectUrls(bullet),
        },
      })
    })
  }

  return rows
}

/**
 * Builds the list of citations the AI is allowed to use.
 * Anything not in this list must be answered with "I'm not fully sure."
 */
function buildAllowList(sourcesMd: string, allMd: string): SourceAllowList {
  const sections = splitSections(sourcesMd)
  const sectionBody = (re: RegExp) => sections.find((s) => re.test(s.heading))?.body ?? ''

  const quranBody = sectionBody(/Key Quran Verses/i)
  const quranRefs = [
    ...new Set(
      (quranBody.match(/\*\*(\d{1,3}:\d{1,3}(?:\s*[–-]\s*\d{1,3})?)\*\*/g) ?? []).map((m) =>
        m.replace(/\*\*/g, '').replace(/\s*[–-]\s*/, '–'),
      ),
    ),
  ]

  const hadithBody = sectionBody(/Key Hadith/i)
  const hadith = [
    ...new Set(
      (
        hadithBody.match(
          /(Sahih al-Bukhari|Sahih Muslim|Sunan al-Tirmidhi|Sahih al-Jami')\s*\*\*(\d+)\*\*/g,
        ) ?? []
      ).map((m) => m.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()),
    ),
  ]
  // Bukhari 1358 also lists 1385 and 4775 in plain text.
  for (const extra of hadithBody.match(/\(also (\d+); Tafsir (\d+)\)/) ?? []) {
    void extra
  }
  const alsoNumbers = /\(also (\d+); Tafsir (\d+)\)/.exec(hadithBody)
  if (alsoNumbers) {
    hadith.push(`Sahih al-Bukhari ${alsoNumbers[1]}`, `Sahih al-Bukhari ${alsoNumbers[2]}`)
  }

  const islamqaIds = [
    ...new Set([
      ...(sourcesMd.match(/islamqa\.info\/en\/answers\/(\d+)/g) ?? []).map(
        (m) => m.split('/').pop() as string,
      ),
      ...(sectionBody(/islamqa\.info Answers/i).match(/^\s*-\s*\*\*(\d+)\*\*/gm) ?? []).map((m) =>
        m.replace(/[^\d]/g, ''),
      ),
    ]),
  ]

  // islamqa.org (SeekersGuidance) ids are written as a path, not a bold number.
  const islamqaOrgIds = [
    ...new Set(
      (sourcesMd.match(/islamqa\.org\/[a-z]+\/[a-z-]+\/(\d+)/gi) ?? []).map(
        (m) => m.split('/').filter(Boolean).pop() as string,
      ),
    ),
  ]

  // File 03 writes some academic links without "https://" (e.g.
  // "plato.stanford.edu/entries/evil/"), so pick those up too. URLs may come
  // from any research file - only Quran/hadith/fatwa numbers are limited to 03.
  const bare = (allMd.match(/\b(?:plato\.stanford\.edu|iep\.utm\.edu|sunnah\.com|consc\.net)\/[^\s),;]+/g) ?? [])
    .map((u) => `https://${u.replace(/[),.;]+$/, '')}`)

  return {
    quranRefs,
    hadith: [...new Set(hadith)],
    islamqaIds: [...new Set([...islamqaIds, ...islamqaOrgIds])],
    urls: [...new Set([...collectUrls(allMd), ...bare])].sort(),
  }
}

// ------------------------------------------------------------------ 08 ---

function parseLearningPath(md: string): LevelDef[] {
  const levels: LevelDef[] = []

  for (const { heading, body } of splitSections(md)) {
    const head = /^Level\s+(\d+)\s*[—–-]\s*(.*)$/.exec(heading)
    if (!head) continue

    const level = Number(head[1])
    const name = head[2].trim()
    const f = readFields(body)
    // "Goals:" runs until the module bullets, which carry no bold label of
    // their own, so cut it at the first "- Module" line.
    const goals = (f.get('goals') ?? '').split(/\n\s*-\s*Module\b/)[0].trim()
    const checkpoint = f.get('checkpoint') ?? ''

    const modules: ModuleDef[] = []
    for (const line of body.split('\n')) {
      const m = /^\s*-\s*Module\s+([\d.]+):\s*(.*)$/.exec(line)
      if (!m) continue
      const id = m[1]
      // Drop "(file 00, 04)" pointers, leaving one space behind so
      // "Dawah adab (file 05) + finding..." does not become "adab+ finding".
      const title = stripInlineLinks(
        m[2]
          .replace(/\s*\(file[^)]*\)\s*/gi, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim(),
      )
      modules.push({ id, level, title, slugs: [] })
    }

    levels.push({ level, name, goals, modules, checkpoint })
  }

  return levels
}

/** Links each module to the research rows it teaches, using the ids in its title. */
function attachModuleSlugs(levels: LevelDef[], content: ContentRow[]): void {
  const byCode = new Map<string, string>()
  for (const row of content) {
    const code = (row.meta as { code?: string }).code
    if (code) byCode.set(code, row.slug)
  }

  // File 08 names some modules by topic rather than by id ("Glossary + valid
  // vs sound"), so these point them at the matching guide rows.
  const extras: Record<string, string[]> = {
    '1.1': ['guide-what-is-an-argument', 'guide-valid-vs-sound'],
    '1.3': [
      'guide-the-golden-verses',
      'guide-first-find-the-root-of-their-doubt',
      'guide-a-simple-dawah-flow',
    ],
    '2.3': ['guide-how-to-steelman'],
    '3.3': ['guide-emotional-vs-intellectual-doubters', 'guide-protecting-your-own-faith'],
    '4.2': ['guide-burden-of-proof'],
  }

  const glossarySlugs = content.filter((c) => c.kind === 'glossary').map((c) => c.slug)

  for (const level of levels) {
    for (const mod of level.modules) {
      const ids = [...findIds(mod.title), ...findPersonaIds(mod.title)]
      const slugs = ids.map((id) => byCode.get(id)).filter((s): s is string => Boolean(s))
      const extra = (extras[mod.id] ?? []).filter((slug) =>
        content.some((c) => c.slug === slug),
      )
      mod.slugs = [...new Set([...slugs, ...extra])]
      if (mod.id === '1.1') mod.slugs.push(...glossarySlugs.slice(0, 12))
    }
  }
}

function parseSampleQuizzes(md: string): QuizQuestion[] {
  const section = splitSections(md).find((s) => /Sample Quiz Questions/i.test(s.heading))
  if (!section) return []

  const questions: QuizQuestion[] = []
  const blocks = section.body.split(/(?=\*\*Q\d+\.\*\*)/).filter((b) => /\*\*Q\d+\.\*\*/.test(b))

  for (const block of blocks) {
    const head = /\*\*Q(\d+)\.\*\*\s*(.*)/.exec(block)
    if (!head) continue

    const choices = readBullets(block)
      .map((line) => {
        const m = /^([A-D])\)\s*(.*)$/.exec(line)
        if (!m) return null
        const correct = /✅/.test(m[2])
        return { key: m[1], text: m[2].replace(/✅/g, '').trim(), correct }
      })
      .filter((c): c is { key: string; text: string; correct: boolean } => c !== null)

    const explain = /\*Explain:\*\s*(.*)/.exec(block)?.[1]?.trim() ?? ''
    if (!choices.some((c) => c.correct)) continue

    // The file-08 samples do not print ids, so map them by their topic.
    const topic = `${head[2]} ${explain}`.toLowerCase()
    const topicCites = [
      [/kalam|begins to exist/, 'ARG-2'],
      [/euthyphro/, 'OBJ-4'],
      [/grieving|empathy/, 'OBJ-3'],
      [/genetic fallacy|born muslim/, 'OBJ-14'],
      [/overclaim|100%|scientific miracle/, 'ARG-2'],
    ] as const
    const cites = [
      ...new Set([
        ...findIds(`${head[2]} ${explain}`),
        ...topicCites.filter(([re]) => re.test(topic)).map(([, id]) => id),
      ]),
    ]

    questions.push({
      id: `q08-${head[1]}`,
      module: 'sample',
      question: head[2].trim(),
      choices,
      explanation: explain,
      cites,
      origin: '08',
    })
  }

  return questions
}

function parseSampleFlashcards(md: string): FlashcardRow[] {
  const section = splitSections(md).find((s) => /Sample Flashcards/i.test(s.heading))
  if (!section) return []

  return readBullets(section.body)
    .map((line) => {
      const m = /^(.*?)\s*→\s*(.*)$/.exec(stripInlineLinks(line))
      if (!m) return null
      const front = m[1].trim()
      return {
        slug: `fc-core-${slugify(front)}`,
        front,
        back: m[2].trim(),
        tags: ['core', 'level-1'],
      }
    })
    .filter((r): r is FlashcardRow => r !== null)
}

/** Extra flashcards built straight from the glossary and the Q&A bank. */
function derivedFlashcards(content: ContentRow[]): FlashcardRow[] {
  const cards: FlashcardRow[] = []

  for (const row of content) {
    if (row.kind === 'glossary') {
      cards.push({
        slug: `fc-${row.slug}`,
        front: `What does "${row.title}" mean?`,
        back: row.body_md.split('\n')[0],
        tags: [row.tags.includes('fallacy') ? 'fallacy' : 'glossary', 'word'],
      })
    }
    if (row.kind === 'qa') {
      const meta = row.meta as { question?: string; answer?: string; cites?: string[] }
      if (meta.question && meta.answer) {
        cards.push({
          slug: `fc-${row.slug}`,
          front: meta.question,
          back: meta.answer,
          tags: ['qa', row.difficulty, ...(meta.cites ?? [])],
        })
      }
    }
  }

  return cards
}

// -------------------------------------------------------------- assemble ---

export function parseResearch(files: ResearchFiles): ParsedResearch {
  const args = parseArguments(files.arguments)
  const objs = parseObjections(files.objections)
  const personas = parsePersonas(files.personas)
  const qa = parseQaBank(files.qa)
  const glossary = parseGlossary(files.index)
  const fallacies = parseFallacies(files.philosophy)
  const guides = parseGuides(files.philosophy, files.method)
  const sources = parseSources(files.sources)
  const rubric = parseRubric(files.personas)

  const content: ContentRow[] = [
    ...args,
    ...objs,
    ...personas,
    ...qa,
    ...glossary,
    ...fallacies,
    ...guides,
    ...sources,
    ...(rubric ? [rubric] : []),
  ]

  const seen = new Set<string>()
  for (const row of content) {
    if (seen.has(row.slug)) throw new Error(`Duplicate slug from /research: ${row.slug}`)
    seen.add(row.slug)
    row.tags = [...new Set(row.tags.filter(Boolean))]
  }

  const levels = parseLearningPath(files.learning)
  attachModuleSlugs(levels, content)

  const flashcards = [...parseSampleFlashcards(files.learning), ...derivedFlashcards(content)]
  const cardSlugs = new Set<string>()
  const uniqueCards = flashcards.filter((c) => {
    if (cardSlugs.has(c.slug)) return false
    cardSlugs.add(c.slug)
    return true
  })

  return {
    content,
    flashcards: uniqueCards,
    levels,
    quizzes: [
      ...parseSampleQuizzes(files.learning).map((q) => ({
        ...q,
        module: SAMPLE_QUIZ_MODULES[q.id] ?? q.module,
      })),
      ...derivedQuizzes(),
    ],
    allowList: buildAllowList(files.sources, Object.values(files).join('\n\n')),
  }
}
