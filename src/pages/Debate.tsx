import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Card, ErrorNote, Page, PageHeader, Disclaimer } from '../components/ui'
import { personas, argumentsList, objections, codeOf } from '../lib/content'
import { difficultyTone } from '../lib/format'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { DebateSide, Difficulty } from '../lib/types'

const DIFFICULTIES: { key: Difficulty; label: string; help: string }[] = [
  { key: 'easy', label: 'Easy', help: 'Gentle. Good for your first tries.' },
  { key: 'medium', label: 'Medium', help: 'A normal, real conversation.' },
  { key: 'hard', label: 'Hard', help: 'They push back properly.' },
  { key: 'expert', label: 'Expert', help: 'Sharp and precise. Be ready.' },
]

export default function Debate() {
  const navigate = useNavigate()
  const { user, offline } = useAuth()
  const [params] = useSearchParams()

  const [personaSlug, setPersonaSlug] = useState(params.get('persona') ?? 'p1-sara')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [topic, setTopic] = useState<string>('')
  const [side, setSide] = useState<DebateSide>('muslim')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  const persona = useMemo(
    () => personas.find((p) => p.slug === personaSlug) ?? personas[0],
    [personaSlug],
  )
  const personaMeta = (persona?.meta ?? {}) as Record<string, unknown>

  const topics = useMemo(
    () => [...argumentsList, ...objections].map((r) => ({ id: codeOf(r), title: r.title })),
    [],
  )

  async function start() {
    setError('')
    if (!supabase || !user) {
      setError('You need to be connected to start a debate. Check your .env keys.')
      return
    }
    setStarting(true)
    const { data, error: dbError } = await supabase
      .from('debates')
      .insert({
        user_id: user.id,
        persona_id: persona.slug,
        difficulty,
        topic: topic || null,
        user_plays_side: side,
      })
      .select('id')
      .single()

    setStarting(false)
    if (dbError || !data) {
      setError(dbError?.message ?? 'Could not start the debate.')
      return
    }
    navigate(`/debate/${data.id}`)
  }

  return (
    <Page>
      <PageHeader title="Debate" subtitle="Practise against a pretend atheist" />

      {offline && (
        <Card className="mb-4 border-amber-400 bg-amber-50 text-sm dark:bg-amber-950/30">
          <p className="font-semibold">Not connected</p>
          <p className="muted mt-1">
            Add your Supabase keys to <code>.env</code> to save debates and talk to the AI.
          </p>
        </Card>
      )}

      {/* 1. Who */}
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide muted">
        1. Who do you want to talk to?
      </h2>
      <div className="grid gap-2">
        {personas.map((p) => {
          const m = p.meta as Record<string, unknown>
          const chosen = p.slug === personaSlug
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => setPersonaSlug(p.slug)}
              aria-pressed={chosen}
              className={`card p-3 text-left transition-colors ${
                chosen ? 'border-brand-500 ring-2 ring-brand-500/30' : 'hover:border-brand-400'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{String(m.name ?? '')}</span>
                <Badge tone={difficultyTone(p.difficulty)}>{p.difficulty}</Badge>
                {Boolean(m.sensitive) && <Badge tone="warn">sensitive — be gentle</Badge>}
              </div>
              <p className="muted mt-0.5 text-sm">{String(m.role ?? '')}</p>
              {chosen && m.opening ? (
                <p className="mt-2 rounded-lg bg-black/5 p-2 text-sm italic dark:bg-white/10">
                  “{String(m.opening)}”
                </p>
              ) : null}
            </button>
          )
        })}
      </div>

      {/* 2. How hard */}
      <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide muted">
        2. How hard should it be?
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setDifficulty(d.key)}
            aria-pressed={difficulty === d.key}
            className={`card p-3 text-left text-sm ${
              difficulty === d.key
                ? 'border-brand-500 ring-2 ring-brand-500/30'
                : 'hover:border-brand-400'
            }`}
          >
            <span className="font-semibold">{d.label}</span>
            <span className="muted mt-0.5 block text-xs leading-snug">{d.help}</span>
          </button>
        ))}
      </div>

      {/* 3. Topic */}
      <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide muted">
        3. Pick a topic (optional)
      </h2>
      <select
        className="field"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        aria-label="Topic"
      >
        <option value="">Let them choose</option>
        {topics.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>

      {/* 4. Side */}
      <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide muted">
        4. Which side do you play?
      </h2>
      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => setSide('muslim')}
          aria-pressed={side === 'muslim'}
          className={`card p-3 text-left text-sm ${
            side === 'muslim' ? 'border-brand-500 ring-2 ring-brand-500/30' : 'hover:border-brand-400'
          }`}
        >
          <span className="font-semibold">I answer as the Muslim</span>
          <span className="muted mt-0.5 block text-xs leading-snug">
            The normal way. The AI plays the atheist and you give dawah.
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSide('atheist')}
          aria-pressed={side === 'atheist'}
          className={`card p-3 text-left text-sm ${
            side === 'atheist'
              ? 'border-brand-500 ring-2 ring-brand-500/30'
              : 'hover:border-brand-400'
          }`}
        >
          <span className="font-semibold">I argue the atheist side (steelman training)</span>
          <span className="muted mt-0.5 block text-xs leading-snug">
            Harder, and very useful. The AI plays a wise da'i and you attack. This trains you
            to say the other side fairly.
          </span>
        </button>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorNote message={error} />
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary mt-5 w-full"
        onClick={() => void start()}
        disabled={starting || offline}
      >
        {starting ? 'Starting…' : `Start debate with ${String(personaMeta.name ?? '')}`}
      </button>

      <Disclaimer />
    </Page>
  )
}
