import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Card, ErrorNote, Page, PageHeader, Spinner } from '../components/ui'
import { Markdown } from '../components/Markdown'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { coachHint, debateTurn } from '../lib/api'
import { checkSafetyLocal } from '../lib/safety'
import { getBySlug, codeOf, getByKey } from '../lib/content'
import type { Debate, DebateMessage } from '../lib/types'

interface Turn {
  id: string
  role: 'user' | 'ai'
  content: string
}

export default function DebateRoom() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [debate, setDebate] = useState<Debate | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [safetyNote, setSafetyNote] = useState('')

  const [coachOn, setCoachOn] = useState(false)
  const [hint, setHint] = useState('')
  const [hintLoading, setHintLoading] = useState(false)

  const endRef = useRef<HTMLDivElement>(null)
  const persona = debate ? getBySlug(debate.persona_id) : undefined
  const personaName = String((persona?.meta as { name?: string } | undefined)?.name ?? 'Opponent')
  const sensitive = Boolean((persona?.meta as { sensitive?: boolean } | undefined)?.sensitive)

  // Load the debate and any messages already saved.
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase || !user || !id) {
        setLoading(false)
        return
      }
      const { data: d } = await supabase.from('debates').select('*').eq('id', id).maybeSingle()
      if (cancelled) return
      if (!d) {
        setError('That debate was not found.')
        setLoading(false)
        return
      }
      setDebate(d as Debate)

      const { data: msgs } = await supabase
        .from('debate_messages')
        .select('id, role, content')
        .eq('debate_id', id)
        .order('created_at', { ascending: true })

      if (cancelled) return
      setTurns(
        ((msgs ?? []) as DebateMessage[])
          .filter((m) => m.role === 'user' || m.role === 'ai')
          .map((m) => ({ id: m.id, role: m.role as 'user' | 'ai', content: m.content })),
      )
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id, user])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns, hint])

  // The opponent speaks first, using their opening line from file 06.
  useEffect(() => {
    if (loading || !debate || turns.length > 0 || !persona) return
    const opening = String((persona.meta as { opening?: string }).opening ?? '')
    if (!opening) return

    const seed = async () => {
      if (!supabase) return
      const content =
        debate.user_plays_side === 'atheist'
          ? "Assalamu alaykum. You wanted to argue the atheist side — go ahead, I'm listening. Give me your strongest point."
          : opening
      const { data } = await supabase
        .from('debate_messages')
        .insert({ debate_id: debate.id, role: 'ai', content })
        .select('id, role, content')
        .single()
      if (data) setTurns([{ id: data.id, role: 'ai', content }])
    }
    void seed()
  }, [loading, debate, turns.length, persona])

  const send = useCallback(async () => {
    const text = draft.trim()
    if (!text || !debate || !supabase || sending) return

    setError('')
    setSafetyNote('')

    const safety = checkSafetyLocal(text)
    if (safety.crisis) {
      setSafetyNote(safety.reply)
      setDraft('')
      return
    }

    setSending(true)
    const history = turns.map((t) => ({ role: t.role, content: t.content }))

    // Save the user's turn first so nothing is lost if the AI call fails.
    const { data: saved } = await supabase
      .from('debate_messages')
      .insert({ debate_id: debate.id, role: 'user', content: text })
      .select('id')
      .single()

    const mine: Turn = { id: saved?.id ?? crypto.randomUUID(), role: 'user', content: text }
    setTurns((t) => [...t, mine])
    setDraft('')
    setHint('')

    try {
      const res = await debateTurn({
        debateId: debate.id,
        personaSlug: debate.persona_id,
        difficulty: debate.difficulty,
        topic: debate.topic,
        userPlaysSide: debate.user_plays_side,
        message: text,
        history,
      })
      setTurns((t) => [...t, { id: crypto.randomUUID(), role: 'ai', content: res.reply }])
      if (res.safetyPause) setSafetyNote('The roleplay was paused for safety.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The opponent could not reply.')
    } finally {
      setSending(false)
    }
  }, [draft, debate, sending, turns])

  const askCoach = useCallback(async () => {
    if (!debate) return
    setHintLoading(true)
    try {
      const res = await coachHint({
        personaSlug: debate.persona_id,
        topic: debate.topic,
        userPlaysSide: debate.user_plays_side,
        history: turns.map((t) => ({ role: t.role, content: t.content })),
        draft,
      })
      setHint(res.hint)
    } catch (err) {
      setHint(err instanceof Error ? err.message : 'The coach is not available right now.')
    } finally {
      setHintLoading(false)
    }
  }, [debate, turns, draft])

  if (loading) {
    return (
      <Page>
        <PageHeader title="Debate" back="/debate" />
        <Spinner label="Opening the debate" />
      </Page>
    )
  }

  if (error && !debate) {
    return (
      <Page>
        <PageHeader title="Debate" back="/debate" />
        <ErrorNote message={error} />
      </Page>
    )
  }

  const topicRow = debate?.topic ? getByKey(debate.topic) : undefined

  return (
    <Page>
      <PageHeader
        title={personaName}
        subtitle={`${debate?.difficulty ?? ''} · you play the ${debate?.user_plays_side ?? ''}`}
        back="/debate"
        right={
          <button
            type="button"
            className="btn btn-ghost !min-h-0 !px-3 !py-2 text-sm"
            onClick={() => navigate(`/debate/${id}/scorecard`)}
          >
            End
          </button>
        }
      />

      {(topicRow || sensitive) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {topicRow && (
            <Link to={`/library/${topicRow.slug}`}>
              <Badge tone="brand">Topic: {codeOf(topicRow)} ↗</Badge>
            </Link>
          )}
          {sensitive && <Badge tone="warn">Be gentle — this person is hurting</Badge>}
        </div>
      )}

      <div className="grid gap-3 pb-2">
        {turns.map((t) => (
          <div
            key={t.id}
            className={`max-w-[88%] rounded-2xl p-3 text-sm ${
              t.role === 'user'
                ? 'ml-auto bg-brand-600 text-white'
                : 'mr-auto border border-[color:var(--line)] bg-[color:var(--card)]'
            }`}
          >
            <p className={`mb-1 text-[0.7rem] font-semibold ${t.role === 'user' ? 'text-white/70' : 'muted'}`}>
              {t.role === 'user' ? 'You' : personaName}
            </p>
            {t.role === 'user' ? (
              <p className="whitespace-pre-wrap leading-relaxed">{t.content}</p>
            ) : (
              <Markdown text={t.content} />
            )}
          </div>
        ))}

        {sending && (
          <div className="mr-auto rounded-2xl border border-[color:var(--line)] p-3">
            <span className="muted text-sm">{personaName} is typing…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {safetyNote && (
        <Card className="my-3 border-brand-400 bg-brand-50 dark:bg-brand-950/40">
          <Markdown text={safetyNote} />
        </Card>
      )}

      {error && debate && (
        <div className="my-3">
          <ErrorNote message={error} />
        </div>
      )}

      {/* Coach panel — the opponent never sees this. */}
      <Card className="my-3 border-dashed">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">🧑‍🏫 Coach hints</p>
            <p className="muted text-xs">Private tips. Your opponent cannot see them.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={coachOn}
            onClick={() => setCoachOn((v) => !v)}
            className={`h-7 w-12 shrink-0 rounded-full transition-colors ${
              coachOn ? 'bg-brand-600' : 'bg-[color:var(--line)]'
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                coachOn ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
            <span className="sr-only">Turn coach hints {coachOn ? 'off' : 'on'}</span>
          </button>
        </div>

        {coachOn && (
          <>
            <button
              type="button"
              className="btn btn-ghost mt-3 w-full !min-h-0 !py-2 text-sm"
              onClick={() => void askCoach()}
              disabled={hintLoading}
            >
              {hintLoading ? 'Thinking…' : 'Give me a tip'}
            </button>
            {hint && (
              <p className="mt-2 rounded-lg border border-brand-300 bg-brand-50 p-2 text-sm dark:border-brand-800 dark:bg-brand-950/40">
                {hint}
              </p>
            )}
          </>
        )}
      </Card>

      {/* Composer */}
      <div className="sticky bottom-[4.75rem] -mx-4 border-t border-[color:var(--line)] bg-[color:var(--page)] px-4 pb-2 pt-3">
        <label htmlFor="reply" className="sr-only">
          Your reply
        </label>
        <textarea
          id="reply"
          className="field min-h-[4.5rem] resize-y"
          placeholder="Write your answer…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={sending}
          maxLength={4000}
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={() => void send()}
            disabled={sending || !draft.trim()}
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate(`/debate/${id}/scorecard`)}
            disabled={sending}
          >
            End &amp; score
          </button>
        </div>
      </div>
    </Page>
  )
}
