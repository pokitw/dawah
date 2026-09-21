/**
 * ask-qa — answers a question using ONLY the /research content.
 *
 * Flow:
 *   1. Safety check first. A person in real distress gets warmth, not a debate.
 *   2. Find the most relevant research rows.
 *   3. Ask Claude with the Ask/Q&A system prompt + those rows.
 *   4. Throw away any citation that does not point at a row we sent.
 *   5. Save it to qa_sessions for the user's history.
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { EFFORT, MAX_TOKENS } from '../_shared/config.ts'
import { askClaude, friendlyError } from '../_shared/anthropic.ts'
import { fail, json, preflight, readJson } from '../_shared/http.ts'
import { askSystemPrompt } from '../_shared/prompts.ts'
import { findResearch, serviceClient, userClient } from '../_shared/retrieval.ts'
import { unsupportedNumbers, verifyCitations } from '../_shared/citations.ts'
import { checkSafety } from '../_shared/safety.ts'

interface Body {
  question?: string
  /** True when the user pressed "Explain simpler". */
  explainSimpler?: boolean
  /** The previous answer, so "explain simpler" can rewrite it. */
  previousAnswer?: string
  /** Set false to skip saving (used by the trainers). */
  save?: boolean
}

const ANSWER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['answer_md', 'citations', 'confidence', 'strength'],
  properties: {
    answer_md: {
      type: 'string',
      description:
        'The answer in simple English markdown. Short sentences. Hard words explained. ' +
        'Ends with a one-line reminder that this is a study tool, not a fatwa.',
    },
    citations: {
      type: 'array',
      description: 'Only ids that appear in the research context.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'label', 'url'],
        properties: {
          id: { type: 'string', description: 'e.g. ARG-2, OBJ-6, or a row slug' },
          label: { type: 'string', description: 'What to show, e.g. "Quran 52:35-36"' },
          url: { type: ['string', 'null'] },
        },
      },
    },
    confidence: {
      type: 'string',
      enum: ['answered', 'unsure', 'scholars-differ'],
      description:
        '"unsure" when the context does not cover it; "scholars-differ" when the research says so.',
    },
    strength: {
      type: 'string',
      enum: ['strong-mainstream', 'weak-avoid', 'not-applicable'],
      description: 'Mark "weak-avoid" if the research warns against this line of argument.',
    },
  },
} as const

Deno.serve(async (req: Request) => {
  const early = preflight(req)
  if (early) return early

  const body = await readJson<Body>(req)
  const question = (body?.question ?? '').trim()
  if (!question) return fail('Please type a question first.')
  if (question.length > 2000) return fail('That question is too long. Try a shorter one.')

  // 1. Safety comes before anything else.
  const safety = checkSafety(question)
  if (safety.crisis) {
    return json({
      answer_md: safety.reply,
      citations: [],
      confidence: 'answered',
      strength: 'not-applicable',
      safetyPause: true,
      warnings: [],
    })
  }

  try {
    const db = serviceClient()

    // 2. Retrieve.
    const rows = await findResearch(db, question)

    // 3. Ask.
    const userTurn = body?.explainSimpler && body?.previousAnswer
      ? `My question was: ${question}\n\nYou answered:\n${body.previousAnswer.slice(0, 6000)}\n\nPlease explain that again, but simpler.`
      : question

    const result = await askClaude({
      system: askSystemPrompt(rows, Boolean(body?.explainSimpler)),
      messages: [{ role: 'user', content: userTurn }],
      maxTokens: MAX_TOKENS.qa,
      effort: EFFORT.qa,
      schema: ANSWER_SCHEMA as unknown as Record<string, unknown>,
    })

    const parsed = (result.parsed ?? {}) as {
      answer_md?: string
      citations?: unknown
      confidence?: string
      strength?: string
    }
    const answer = (parsed.answer_md ?? result.text).trim()
    if (!answer) return fail('The AI sent back an empty answer. Please try again.', 502)

    // 4. Verify every citation against what we actually sent.
    const { kept, dropped } = verifyCitations(parsed.citations, rows)
    const madeUpNumbers = unsupportedNumbers(answer, rows)

    const warnings: string[] = []
    if (dropped.length) {
      warnings.push(
        `${dropped.length} source${dropped.length > 1 ? 's were' : ' was'} removed because ` +
          'it is not in the research files.',
      )
    }
    if (madeUpNumbers.length) {
      warnings.push(
        'This answer mentions a number that is not in the research files ' +
          `(${madeUpNumbers.slice(0, 3).join(', ')}). Please check it with a scholar before using it.`,
      )
    }

    // 5. Save for history (best effort — never block the answer on this).
    if (body?.save !== false) {
      try {
        const asUser = userClient(req)
        const { data: auth } = await asUser.auth.getUser()
        if (auth?.user) {
          await asUser.from('qa_sessions').insert({
            user_id: auth.user.id,
            question,
            answer_md: answer,
            citations: kept,
          })
        }
      } catch {
        // A history write failing must never lose the answer.
      }
    }

    return json({
      answer_md: answer,
      citations: kept,
      confidence: parsed.confidence ?? 'answered',
      strength: parsed.strength ?? 'not-applicable',
      safetyPause: false,
      warnings,
      usedSources: rows.map((r) => ({
        id: (r.meta as { code?: string } | null)?.code ?? r.slug,
        slug: r.slug,
        title: r.title,
        kind: r.kind,
      })),
    })
  } catch (err) {
    const { message, status } = friendlyError(err)
    return fail(message, status)
  }
})
