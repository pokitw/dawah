import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Card, ErrorNote, Page, PageHeader, Spinner, Disclaimer } from '../components/ui'
import { Markdown } from '../components/Markdown'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { scoreDebate, type ScoreResponse } from '../lib/api'
import {
  RUBRIC_KEYS,
  RUBRIC_LABELS,
  RUBRIC_HELP,
  bandFor,
  totalOf,
  type RubricScores,
} from '../lib/scoring'
import { getByKey, codeOf } from '../lib/content'

function ScoreBar({ label, help, value }: { label: string; help: string; value: number }) {
  const pct = (value / 5) * 100
  const tone =
    value >= 4 ? 'bg-emerald-500' : value >= 3 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <li className="py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold tabular-nums">{value}/5</span>
      </div>
      <div
        className="mt-1 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
        role="img"
        aria-label={`${label}: ${value} out of 5`}
      >
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="muted mt-1 text-xs leading-snug">{help}</p>
    </li>
  )
}

export default function Scorecard() {
  const { id = '' } = useParams()
  const { user, refreshProfile } = useAuth()
  const [card, setCard] = useState<ScoreResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!supabase || !user || !id) {
        setError('You need to be connected to see a scorecard.')
        setLoading(false)
        return
      }

      // If it was already scored, just show it again (replays are free).
      const { data: existing } = await supabase
        .from('scorecards')
        .select('*')
        .eq('debate_id', id)
        .maybeSingle()

      if (cancelled) return

      if (existing) {
        const scores = existing as unknown as RubricScores & {
          total: number
          strengths_md: string
          weaknesses_md: string
          better_answer_md: string
          sources_to_review: string[]
        }
        setCard({
          logic: scores.logic,
          sources: scores.sources,
          understanding: scores.understanding,
          clarity: scores.clarity,
          adab: scores.adab,
          overclaim: scores.overclaim,
          total: scores.total,
          band: bandFor(scores.total),
          strengths_md: scores.strengths_md,
          weaknesses_md: scores.weaknesses_md,
          better_answer_md: scores.better_answer_md,
          sources_to_review: scores.sources_to_review ?? [],
          xpAwarded: 0,
        })
        setLoading(false)
        return
      }

      try {
        const result = await scoreDebate({ debateId: id })
        if (cancelled) return
        setCard(result)
        void refreshProfile()
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not score this.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [id, user, refreshProfile])

  if (loading) {
    return (
      <Page>
        <PageHeader title="Scorecard" back="/debate" />
        <Spinner label="Marking your answers" />
        <p className="muted mt-2 text-sm">
          This takes a few seconds. It reads everything you wrote and checks it against the
          research files.
        </p>
      </Page>
    )
  }

  if (error || !card) {
    return (
      <Page>
        <PageHeader title="Scorecard" back="/debate" />
        <ErrorNote message={error || 'No scorecard.'} />
        <Link to="/debate" className="btn btn-primary mt-4 w-full">
          Try another debate
        </Link>
      </Page>
    )
  }

  const scores: RubricScores = {
    logic: card.logic,
    sources: card.sources,
    understanding: card.understanding,
    clarity: card.clarity,
    adab: card.adab,
    overclaim: card.overclaim,
  }
  // Recompute locally so the number shown always matches the bars above it.
  const total = totalOf(scores)
  const band = bandFor(total)
  const tone = total >= 26 ? 'good' : total >= 20 ? 'brand' : total >= 14 ? 'warn' : 'bad'

  return (
    <Page>
      <PageHeader title="Your scorecard" back="/debate" />

      <Card className="text-center">
        <p className="muted text-sm">You scored</p>
        <p className="text-4xl font-bold tabular-nums">
          {total}
          <span className="muted text-xl">/30</span>
        </p>
        <div className="mt-2 flex justify-center">
          <Badge tone={tone}>{band}</Badge>
        </div>
        {card.xpAwarded > 0 && (
          <p className="muted mt-2 text-sm">+{card.xpAwarded} XP</p>
        )}
      </Card>

      <Card className="mt-3">
        <h2 className="text-sm font-bold">The six parts</h2>
        <ul className="mt-1 divide-y divide-[color:var(--line)]">
          {RUBRIC_KEYS.map((key) => (
            <ScoreBar
              key={key}
              label={RUBRIC_LABELS[key]}
              help={RUBRIC_HELP[key]}
              value={scores[key]}
            />
          ))}
        </ul>
      </Card>

      {card.strengths_md && (
        <Card className="mt-3 border-emerald-400">
          <h2 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
            ✅ What was strong
          </h2>
          <Markdown text={card.strengths_md} className="text-sm" />
        </Card>
      )}

      {card.weaknesses_md && (
        <Card className="mt-3 border-amber-400">
          <h2 className="text-sm font-bold text-amber-700 dark:text-amber-300">
            🔧 What to work on
          </h2>
          <Markdown text={card.weaknesses_md} className="text-sm" />
        </Card>
      )}

      {card.better_answer_md && (
        <Card className="mt-3">
          <h2 className="text-sm font-bold">✍️ A better answer you could have given</h2>
          <Markdown text={card.better_answer_md} className="text-sm" />
        </Card>
      )}

      {card.sources_to_review.length > 0 && (
        <Card className="mt-3">
          <h2 className="text-sm font-bold">📚 Study these next</h2>
          <ul className="mt-2 grid gap-2">
            {card.sources_to_review.map((idText) => {
              const row = getByKey(idText)
              return (
                <li key={idText}>
                  {row ? (
                    <Link
                      to={`/library/${row.slug}`}
                      className="card block p-2 text-sm hover:border-brand-400"
                    >
                      <Badge tone="brand">{codeOf(row)}</Badge>{' '}
                      {row.title.replace(/^(ARG|OBJ|P)-?\d+[:—-]\s*/, '')}
                    </Link>
                  ) : (
                    <span className="text-sm">{idText}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <div className="mt-4 grid gap-2">
        <Link to="/debate" className="btn btn-primary">
          Practise again
        </Link>
        <Link to={`/debate/${id}`} className="btn btn-ghost">
          Read the debate again
        </Link>
        <Link to="/weakness" className="btn btn-ghost">
          See what to study next
        </Link>
      </div>

      <Disclaimer />
    </Page>
  )
}
