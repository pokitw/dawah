/**
 * score-debate — marks the user's messages against the file 06 rubric.
 *
 * The AI judges the six parts (0-5 each). Everything after that is done
 * here in plain arithmetic: the total, the band, the XP, and the weakness
 * tracker updates. That way the numbers on the card can never disagree with
 * each other, and a model that returns a wrong total cannot corrupt the
 * user's progress.
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { EFFORT, MAX_TOKENS } from '../_shared/config.ts'
import { askClaude, friendlyError } from '../_shared/anthropic.ts'
import { fail, json, preflight, readJson } from '../_shared/http.ts'
import { scoreSystemPrompt } from '../_shared/prompts.ts'
import { findResearch, loadBySlugsOrCodes, serviceClient, userClient } from '../_shared/retrieval.ts'
import { allowedKeys } from '../_shared/citations.ts'
import {
  bandFor,
  normalizeScores,
  totalOf,
  weaknessUpdates,
  xpForDebate,
  type RubricKey,
} from '../_shared/scoring.ts'

interface Body {
  debateId?: string
}

const SCORE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'logic',
    'sources',
    'understanding',
    'clarity',
    'adab',
    'overclaim',
    'strengths_md',
    'weaknesses_md',
    'better_answer_md',
    'sources_to_review',
  ],
  properties: {
    logic: { type: 'integer', description: '0-5. Valid and sound? Fallacies avoided?' },
    sources: {
      type: 'integer',
      description: '0-5. Correct verses/hadith/fatwas. Invented ones must score very low.',
    },
    understanding: { type: 'integer', description: '0-5. Did they steelman and hit the real point?' },
    clarity: { type: 'integer', description: '0-5. Simple, clear, organised?' },
    adab: { type: 'integer', description: '0-5. Gentle and respectful? No mocking.' },
    overclaim: { type: 'integer', description: '0-5. 5 means they avoided overclaiming.' },
    strengths_md: { type: 'string', description: 'What was strong. Simple English, encouraging.' },
    weaknesses_md: { type: 'string', description: 'What was weak. Honest but kind.' },
    better_answer_md: {
      type: 'string',
      description: 'A better sample answer in simple English, using only research sources.',
    },
    sources_to_review: {
      type: 'array',
      description: 'Ids from the context to study next, e.g. ["OBJ-2","ARG-2"].',
      items: { type: 'string' },
    },
  },
} as const

Deno.serve(async (req: Request) => {
  const early = preflight(req)
  if (early) return early

  const body = await readJson<Body>(req)
  const debateId = body?.debateId
  if (!debateId) return fail('Missing debate id.')

  try {
    const db = serviceClient()
    const asUser = userClient(req)

    const { data: auth } = await asUser.auth.getUser()
    if (!auth?.user) return fail('Please sign in first.', 401)

    const { data: debate } = await asUser
      .from('debates')
      .select('id, persona_id, difficulty, topic, user_plays_side')
      .eq('id', debateId)
      .maybeSingle()
    if (!debate) return fail('That debate was not found.', 404)

    const { data: messages } = await asUser
      .from('debate_messages')
      .select('role, content, created_at')
      .eq('debate_id', debateId)
      .order('created_at', { ascending: true })

    const turns = (messages ?? []).filter((m) => m.role === 'user' || m.role === 'ai')
    const userTurns = turns.filter((m) => m.role === 'user')
    if (userTurns.length === 0) {
      return fail('You have not written anything yet, so there is nothing to score.')
    }

    // Context: the topic, the persona's favourite objections, and whatever
    // the user actually talked about.
    const [personaRow] = await loadBySlugsOrCodes(db, [debate.persona_id])
    const favourites =
      ((personaRow?.meta as { favourite_objections?: string[] } | undefined)
        ?.favourite_objections) ?? []
    const pinned = await loadBySlugsOrCodes(db, [
      ...favourites,
      ...(debate.topic ? [debate.topic] : []),
    ])
    const searched = await findResearch(
      db,
      userTurns.map((m) => m.content).join(' ').slice(0, 1500),
      [],
      8,
    )
    const seen = new Set<string>()
    const rows = [...pinned, ...searched].filter((r) =>
      seen.has(r.slug) ? false : (seen.add(r.slug), true),
    )

    const transcript = turns
      .map((m) => `${m.role === 'ai' ? 'OPPONENT' : 'USER'}: ${m.content}`)
      .join('\n\n')
      .slice(0, 40000)

    const result = await askClaude({
      system: scoreSystemPrompt(rows),
      messages: [
        {
          role: 'user',
          content: [
            `The user practised the ${debate.user_plays_side} side at "${debate.difficulty}" difficulty.`,
            debate.topic ? `Topic: ${debate.topic}` : '',
            '',
            'Here is the whole debate. Score ONLY the USER lines.',
            '',
            transcript,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
      maxTokens: MAX_TOKENS.score,
      effort: EFFORT.score,
      schema: SCORE_SCHEMA as unknown as Record<string, unknown>,
    })

    const parsed = (result.parsed ?? {}) as Partial<Record<RubricKey, unknown>> & {
      strengths_md?: string
      weaknesses_md?: string
      better_answer_md?: string
      sources_to_review?: unknown
    }

    // The app does the arithmetic, not the model.
    const scores = normalizeScores(parsed)
    const total = totalOf(scores)
    const band = bandFor(total)

    // Only keep review ids that really exist in what we showed the model.
    const allowed = allowedKeys(rows)
    const reviewIds = (
      Array.isArray(parsed.sources_to_review) ? parsed.sources_to_review : []
    )
      .map((v) => String(v).trim().toUpperCase())
      .filter((v) => allowed.has(v.toLowerCase()))
      .slice(0, 8)

    const { error: cardError } = await asUser.from('scorecards').insert({
      debate_id: debateId,
      ...scores,
      total,
      strengths_md: String(parsed.strengths_md ?? '').slice(0, 5000),
      weaknesses_md: String(parsed.weaknesses_md ?? '').slice(0, 5000),
      better_answer_md: String(parsed.better_answer_md ?? '').slice(0, 8000),
      sources_to_review: reviewIds,
    })
    if (cardError && !cardError.message.includes('duplicate')) {
      return fail(`Could not save the scorecard: ${cardError.message}`, 500)
    }

    await asUser.from('debates').update({ ended_at: new Date().toISOString() }).eq('id', debateId)

    // Weakness tracker + XP.
    for (const update of weaknessUpdates(scores, reviewIds)) {
      await asUser.rpc('record_weakness', { p_tag: update.tag, p_score: update.score })
    }

    const xp = xpForDebate(total, debate.difficulty)
    await asUser.rpc('record_activity', { p_xp: xp })

    return json({
      ...scores,
      total,
      band,
      strengths_md: parsed.strengths_md ?? '',
      weaknesses_md: parsed.weaknesses_md ?? '',
      better_answer_md: parsed.better_answer_md ?? '',
      sources_to_review: reviewIds,
      xpAwarded: xp,
    })
  } catch (err) {
    const { message, status } = friendlyError(err)
    return fail(message, status)
  }
})
