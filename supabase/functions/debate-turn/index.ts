/**
 * debate-turn — one reply from the AI opponent, in character.
 *
 * The persona comes from the database (seeded from 06-roleplay-personas.md),
 * together with the objections that persona likes to use. Safety is checked
 * before the AI runs, so a real cry for help always pauses the roleplay.
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { EFFORT, MAX_TOKENS } from '../_shared/config.ts'
import { askClaude, friendlyError } from '../_shared/anthropic.ts'
import { fail, json, preflight, readJson } from '../_shared/http.ts'
import { debateSystemPrompt } from '../_shared/prompts.ts'
import {
  findResearch,
  loadBySlugsOrCodes,
  serviceClient,
  userClient,
  type ResearchRow,
} from '../_shared/retrieval.ts'
import { unsupportedNumbers } from '../_shared/citations.ts'
import { checkSafety } from '../_shared/safety.ts'

interface Body {
  debateId?: string
  personaSlug?: string
  difficulty?: string
  topic?: string | null
  userPlaysSide?: 'muslim' | 'atheist'
  message?: string
  history?: { role: string; content: string }[]
}

/** Builds the persona description that goes into {persona_block}. */
function personaBlock(row: ResearchRow | undefined): { name: string; block: string } {
  if (!row) {
    return {
      name: 'a polite skeptic',
      block: 'A calm, fair skeptic who asks for good reasons and listens to them.',
    }
  }
  const m = (row.meta ?? {}) as Record<string, unknown>
  const line = (label: string, value: unknown) =>
    typeof value === 'string' && value.trim() ? `${label}: ${value.trim()}` : ''

  return {
    name: String(m.name ?? row.title),
    block: [
      line('Role', m.role),
      line('Personality', m.personality),
      line('Speaking style', m.style),
      line('Opening line they use', m.opening),
      line('Favourite objections', (m.favourite_objections as string[] | undefined)?.join(', ')),
      line('Reacts well to', m.reacts_well_to),
      line('Reacts badly to', m.reacts_badly_to),
      line('Why the user practises with them', m.purpose),
      line('Extra safety note', m.safety),
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

Deno.serve(async (req: Request) => {
  const early = preflight(req)
  if (early) return early

  const body = await readJson<Body>(req)
  const message = (body?.message ?? '').trim()
  const debateId = body?.debateId
  if (!message) return fail('Please write something first.')
  if (!debateId) return fail('Missing debate id.')
  if (message.length > 4000) return fail('That message is too long.')

  // Safety wins over staying in character.
  const safety = checkSafety(message)
  if (safety.crisis) {
    return json({ reply: safety.reply, safetyPause: true, warnings: [] })
  }

  try {
    const db = serviceClient()
    const asUser = userClient(req)

    // Confirm this debate really belongs to the caller before writing to it.
    const { data: auth } = await asUser.auth.getUser()
    if (!auth?.user) return fail('Please sign in first.', 401)

    const { data: debate } = await asUser
      .from('debates')
      .select('id, persona_id, difficulty, topic, user_plays_side, ended_at')
      .eq('id', debateId)
      .maybeSingle()
    if (!debate) return fail('That debate was not found.', 404)
    if (debate.ended_at) return fail('This debate has already ended.')

    const personaSlug = body?.personaSlug ?? debate.persona_id
    const difficulty = body?.difficulty ?? debate.difficulty
    const topic = body?.topic ?? debate.topic
    const side = (body?.userPlaysSide ?? debate.user_plays_side) as 'muslim' | 'atheist'

    // Persona row + the objections it favours + anything the topic names.
    const [personaRow] = await loadBySlugsOrCodes(db, [personaSlug])
    const persona = personaBlock(personaRow)
    const favourites =
      ((personaRow?.meta as { favourite_objections?: string[] } | undefined)
        ?.favourite_objections) ?? []

    const keys = [...favourites, ...(topic ? [topic] : [])]
    const pinned = await loadBySlugsOrCodes(db, keys)
    const searched = await findResearch(db, `${topic ?? ''} ${message}`, [], 6)

    const seen = new Set<string>()
    const rows = [...pinned, ...searched].filter((r) =>
      seen.has(r.slug) ? false : (seen.add(r.slug), true),
    )

    const history = (body?.history ?? [])
      .filter((m) => m.role === 'user' || m.role === 'ai')
      .slice(-16)
      .map((m) => ({
        role: (m.role === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: String(m.content).slice(0, 4000),
      }))

    const result = await askClaude({
      system: debateSystemPrompt({
        personaName: persona.name,
        personaBlock: persona.block,
        difficulty,
        userPlaysSide: side,
        rows,
      }),
      messages: [...history, { role: 'user', content: message }],
      maxTokens: MAX_TOKENS.debate,
      effort: EFFORT.debate,
    })

    const reply = result.text.trim()
    if (!reply) return fail('The AI sent back an empty reply. Please try again.', 502)

    // Save both turns. The user message is saved by the app before calling,
    // so only the AI turn is written here.
    await asUser.from('debate_messages').insert({
      debate_id: debateId,
      role: 'ai',
      content: reply,
    })

    const warnings = unsupportedNumbers(reply, rows).length
      ? ['This reply mentions a source number that is not in the research files.']
      : []

    return json({
      reply,
      safetyPause: reply.startsWith('[pausing the roleplay]'),
      warnings,
    })
  } catch (err) {
    const { message: msg, status } = friendlyError(err)
    return fail(msg, status)
  }
})
