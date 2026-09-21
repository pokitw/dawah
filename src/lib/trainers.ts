/**
 * Content for the four trainers.
 *
 * Everything here is built from the research files. The fallacy questions
 * use the examples written in 04-philosophy-basics.md. The weak/strong
 * pairs use the lines the research itself marks as "weak version to AVOID"
 * or "WEAK answer", paired with the reply it marks as strong. Nothing here
 * states an Islamic fact that is not already in /research.
 */
import { fallacies, getByKey, objections, qaBank, type ContentRow } from './content'

// -------------------------------------------------------- fallacy trainer --

export interface FallacyQuestion {
  id: string
  line: string
  answerSlug: string
  answerName: string
  explanation: string
  choices: { slug: string; name: string }[]
}

/** Strips the brackets and speaker prefix off an example from file 04. */
function cleanExample(raw: string): string {
  return raw
    .replace(/^\(/, '')
    .replace(/\)$/, '')
    .replace(/^(Atheist|Muslim):\s*/i, '')
    .trim()
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const out = [...items]
  let state = seed || 1
  for (let i = out.length - 1; i > 0; i--) {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    const j = state % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function fallacyQuestions(): FallacyQuestion[] {
  const withExamples = fallacies.filter(
    (f) => typeof f.meta?.example === 'string' && (f.meta.example as string).trim().length > 10,
  )

  return withExamples.map((row, i) => {
    const others = fallacies
      .filter((f) => f.slug !== row.slug)
      .map((f) => ({ slug: f.slug, name: f.title }))
    const distractors = shuffleWithSeed(others, i + 7).slice(0, 3)
    const choices = shuffleWithSeed(
      [{ slug: row.slug, name: row.title }, ...distractors],
      i + 13,
    )

    return {
      id: `fal-${row.slug}`,
      line: cleanExample(row.meta.example as string),
      answerSlug: row.slug,
      answerName: row.title,
      explanation: String(row.meta.definition ?? row.body_md),
      choices,
    }
  })
}

// ------------------------------------------------- spot the weak answer ----

export interface AnswerPair {
  id: string
  question: string
  strong: string
  weak: string
  why: string
  /** The research id this pair came from. */
  source: string
}

/**
 * Pairs built from lines the research explicitly labels.
 * `weak` is quoted from a "weak version to AVOID" or "WEAK answer" note;
 * `strong` is the reply the same file marks as the good one.
 */
export const ANSWER_PAIRS: AnswerPair[] = [
  {
    id: 'pair-kalam',
    question: 'An atheist asks: does the Big Bang prove God?',
    strong:
      'The evidence fits a beginning, and the stronger point is the philosophical one: whatever begins to exist has a cause. The science of the very first instant is still debated, so I would not lean on it alone.',
    weak: 'Science has PROVEN God with the Big Bang.',
    why: 'File 01 marks "science has PROVEN God" as a weak version to AVOID. Say "consistent with" a beginning instead. Over-claiming loses you the room.',
    source: 'ARG-2',
  },
  {
    id: 'pair-consciousness',
    question: 'An atheist says consciousness is just a gap science has not filled yet.',
    strong:
      'Many philosophers argue this gap is different in kind — you cannot get first-person feeling out of third-person physics even in principle. I would present it as a strong pointer, not a knockout proof.',
    weak: 'Science will NEVER explain anything about the brain.',
    why: 'File 01 marks that as too strong. Only the felt, first-person part is the hard problem. Science explains plenty about the brain.',
    source: 'ARG-6',
  },
  {
    id: 'pair-evil',
    question: 'Someone asks why a specific tragedy was allowed to happen.',
    strong:
      '"It appears pointless to us" is not the same as "it is pointless" — our knowledge is tiny. Islam also gives a positive story: suffering can raise ranks, erase sins, and be perfectly made up for in the hereafter.',
    weak: 'I can tell you exactly why Allah allowed that to happen. The reason was…',
    why: 'File 02 says the STRONG answer is skeptical theism plus the hereafter, and the WEAK answer is pretending we know the exact reason for each tragedy.',
    source: 'OBJ-2',
  },
  {
    id: 'pair-science',
    question: 'An atheist says science keeps replacing God as an explanation.',
    strong:
      'Science explains HOW things work inside nature. It does not answer why there is anything at all, and "only science gives truth" is itself not a scientific claim, so it defeats itself. Islam invites us to study nature (Quran 3:190–191).',
    weak: 'Evolution is fake, and the scientific miracles in the Quran prove Islam is true.',
    why: 'File 02 marks both of those as the weak version: bad anti-evolution science, and "scientific miracles" as knockout proof. Many scholars warn against the second.',
    source: 'OBJ-8',
  },
  {
    id: 'pair-good-without-god',
    question: 'An atheist says they live a good life without believing in God.',
    strong:
      'You are right that an atheist can act good — of course they can. The harder question is a different one: can atheism JUSTIFY that some things are really, objectively wrong?',
    weak: 'You only think you are good. Without God, atheists cannot really be good people.',
    why: 'File 02 says never to call atheists bad people — that is a strawman and it is rude. Separate "living good" from "grounding good".',
    source: 'OBJ-7',
  },
  {
    id: 'pair-waswas',
    question: 'Which is the correct way to quote the cure for waswas?',
    strong:
      'The Prophet ﷺ said to seek refuge in Allah and stop engaging with the whisper (Sahih al-Bukhari 3276, Sahih Muslim 134). A separate narration adds saying "Amantu billah".',
    weak:
      'The Prophet ﷺ said in Bukhari 3276 to seek refuge in Allah and say "Amantu billah".',
    why: 'File 03 flags this exactly: the "Amantu billah" wording is a SEPARATE narration. Do not merge it into Bukhari 3276 or Muslim 134.',
    source: 'src-flag-the-amantu-billah-wording-is-a-separate-narration-from-bukha',
  },
  {
    id: 'pair-grieving',
    question: 'A grieving mother asks why her baby died.',
    strong:
      'I am so sorry. That is a real loss and it deserves more than a lecture. Can you tell me about them? — and then, only when she is ready, gentle hope.',
    weak: 'It is a test from Allah. Life is a test, that is just how it works.',
    why: 'File 06 says P7 reacts badly to cold logic and to "it\'s a test" said harshly. Empathy first, hope second. Match the answer to the ROOT, which here is pain, not intellect.',
    source: 'OBJ-3',
  },
  {
    id: 'pair-exmuslim',
    question: 'An ex-Muslim says they stopped believing after everything they saw and read.',
    strong:
      'That sounds heavy, and I do not want to lecture you. Can I ask what moved you most — was it something you read, or something that happened to you?',
    weak: 'You just want to sin. That is why people leave.',
    why: 'File 05 and the safety rules forbid saying that outright. First find the real root: intellectual doubt, pain, or no exposure. Ask, do not lecture.',
    source: 'OBJ-17',
  },
]

// ------------------------------------------------------ steelman trainer ---

export interface SteelmanTask {
  slug: string
  code: string
  title: string
  /** The research's own fair statement of the objection. */
  modelSteelman: string
  who?: string
}

export function steelmanTasks(): SteelmanTask[] {
  return objections
    .filter((row) => typeof row.meta?.steelman === 'string' && (row.meta.steelman as string).length > 40)
    .map((row) => ({
      slug: row.slug,
      code: String(row.meta.code),
      title: row.title.replace(/^OBJ-\d+:\s*/, ''),
      modelSteelman: String(row.meta.steelman),
      who: typeof row.meta.who === 'string' ? row.meta.who : undefined,
    }))
}

// ---------------------------------------------------------- rapid fire ----

export interface RapidCard {
  slug: string
  question: string
  answer: string
  cites: string[]
  difficulty: string
}

export function rapidCards(difficulty?: string): RapidCard[] {
  return qaBank
    .filter((row) => !difficulty || row.difficulty === difficulty)
    .map((row) => ({
      slug: row.slug,
      question: String(row.meta.question ?? row.title),
      answer: String(row.meta.answer ?? ''),
      cites: Array.isArray(row.meta.cites) ? (row.meta.cites as string[]) : [],
      difficulty: row.difficulty,
    }))
    .filter((c) => c.answer.length > 0)
}

// ------------------------------------------------------- daily challenge ---

/** A number that changes once a day, so everyone gets the same challenge. */
export function daySeed(dateISO: string): number {
  return dateISO.split('-').reduce((acc, part) => acc * 100 + Number(part), 0)
}

export type DailyKind = 'qa' | 'fallacy' | 'weak-answer' | 'steelman'

export interface DailyChallenge {
  kind: DailyKind
  title: string
  /** What the user has to do, in simple words. */
  brief: string
  /** Where to go to do it. */
  to: string
  /** The specific item, when there is one. */
  item?: ContentRow | AnswerPair | FallacyQuestion | SteelmanTask
}

export function dailyChallenge(dateISO: string): DailyChallenge {
  const seed = daySeed(dateISO)
  const kinds: DailyKind[] = ['qa', 'fallacy', 'weak-answer', 'steelman']
  const kind = kinds[seed % kinds.length]

  if (kind === 'fallacy') {
    const questions = fallacyQuestions()
    return {
      kind,
      title: 'Spot the fallacy',
      brief: 'Read the line and name the mistake in the reasoning.',
      to: '/train/fallacy',
      item: questions[seed % questions.length],
    }
  }
  if (kind === 'weak-answer') {
    return {
      kind,
      title: 'Spot the weak answer',
      brief: 'Two answers. Pick the stronger one and see why.',
      to: '/train/weak-answer',
      item: ANSWER_PAIRS[seed % ANSWER_PAIRS.length],
    }
  }
  if (kind === 'steelman') {
    const tasks = steelmanTasks()
    return {
      kind,
      title: 'Steelman an objection',
      brief: 'Say the other side as strongly and fairly as you can, before you answer it.',
      to: '/train/steelman',
      item: tasks[seed % tasks.length],
    }
  }

  const row = qaBank[seed % qaBank.length]
  return {
    kind: 'qa',
    title: "Today's question",
    brief: 'Answer it in your own words first. Then check.',
    to: `/library/${row.slug}`,
    item: row,
  }
}

/** Resolves a research id to a link, used by several trainers. */
export function linkFor(id: string): string | null {
  const row = getByKey(id)
  return row ? `/library/${row.slug}` : null
}
