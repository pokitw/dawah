/**
 * coach-hint — a quiet tip for the user during a live debate.
 *
 * The opponent never sees this. Nothing is written to debate_messages by
 * default, so the hint cannot leak into the AI's view of the conversation.
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { EFFORT, MAX_TOKENS } from '../_shared/config.ts'
import { askClaude, friendlyError } from '../_shared/anthropic.ts'
import { fail, json, preflight, readJson } from '../_shared/http.ts'
import { coachSystemPrompt } from '../_shared/prompts.ts'
import { findResearch, loadBySlugsOrCodes, serviceClient } from '../_shared/retrieval.ts'

interface Body {
  personaSlug?: string
  topic?: string | null
  userPlaysSide?: 'muslim' | 'atheist'
  history?: { role: string; content: string }[]
  /** What the user has typed but not sent yet. */
  draft?: string
}

Deno.serve(async (req: Request) => {
  const early = preflight(req)
  if (early) return early

  const body = await readJson<Body>(req)
  const history = (body?.history ?? []).slice(-8)
  const draft = (body?.draft ?? '').slice(0, 2000)

  if (!history.length && !draft) {
    return json({
      hint: 'Start by asking them a question. Find out WHY they doubt before you answer.',
    })
  }

  try {
    const db = serviceClient()
    const topic = body?.topic ?? ''
    const lastOpponent = [...history].reverse().find((m) => m.role === 'ai')?.content ?? ''

    const pinned = topic ? await loadBySlugsOrCodes(db, [topic]) : []
    const searched = await findResearch(db, `${topic} ${lastOpponent} ${draft}`, [], 6)
    const seen = new Set<string>()
    const rows = [...pinned, ...searched].filter((r) =>
      seen.has(r.slug) ? false : (seen.add(r.slug), true),
    )

    const transcript = history
      .map((m) => `${m.role === 'ai' ? 'OPPONENT' : 'USER'}: ${String(m.content).slice(0, 1200)}`)
      .join('\n')

    const sideNote =
      body?.userPlaysSide === 'atheist'
        ? 'The user is practising the ATHEIST side, so coach them on making the objection strong and fair.'
        : 'The user is practising the MUSLIM side, so coach them on answering well and kindly.'

    const result = await askClaude({
      system: coachSystemPrompt(rows),
      messages: [
        {
          role: 'user',
          content: [
            sideNote,
            '',
            'The debate so far:',
            transcript || '(nothing yet)',
            '',
            draft ? `What the user is about to send:\n${draft}` : '(they have not typed a reply yet)',
            '',
            'Give them one short tip.',
          ].join('\n'),
        },
      ],
      maxTokens: MAX_TOKENS.coach,
      effort: EFFORT.coach,
    })

    const hint = result.text.trim()
    return json({ hint: hint || 'Take a breath. Say their point back to them first, then answer.' })
  } catch (err) {
    const { message, status } = friendlyError(err)
    return fail(message, status)
  }
})
