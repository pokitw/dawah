import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page, PageHeader, Card, EmptyState, Spinner, Badge } from '../components/ui'
import { useAuth } from '../lib/auth'
import { loadWeakness, type WeaknessRow } from '../lib/progress'
import { studyNext, RUBRIC_LABELS, RUBRIC_HELP, type RubricKey } from '../lib/scoring'
import { getByKey, codeOf } from '../lib/content'

/** Turns a stored tag into something a person can read. */
function labelFor(tag: string): { label: string; help: string; to: string | null } {
  if (tag in RUBRIC_LABELS) {
    const key = tag as RubricKey
    return { label: RUBRIC_LABELS[key], help: RUBRIC_HELP[key], to: null }
  }
  const row = getByKey(tag)
  if (row) {
    return {
      label: row.title.replace(/^(ARG|OBJ|P)-?\d+[:—-]\s*/, ''),
      help: `${codeOf(row)} — ${row.kind}`,
      to: `/library/${row.slug}`,
    }
  }
  return { label: tag, help: '', to: null }
}

export default function Weakness() {
  const { user, offline } = useAuth()
  const [stats, setStats] = useState<WeaknessRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) {
        setLoading(false)
        return
      }
      const rows = await loadWeakness(user.id)
      if (!cancelled) {
        setStats(rows)
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user])

  if (loading) {
    return (
      <Page>
        <PageHeader title="Study next" back="/profile" />
        <Spinner />
      </Page>
    )
  }

  const weakest = studyNext(stats, 5)
  const rest = stats
    .filter((s) => s.attempts > 0 && !weakest.some((w) => w.tag === s.tag))
    .sort((a, b) => a.avg_score - b.avg_score)

  return (
    <Page>
      <PageHeader title="Study next" subtitle="Built from your scorecards" back="/profile" />

      {offline && (
        <Card className="mb-3 border-amber-400 bg-amber-50 text-sm dark:bg-amber-950/30">
          <p className="muted">Not connected, so your results cannot be loaded.</p>
        </Card>
      )}

      {weakest.length === 0 ? (
        <EmptyState
          title="Nothing to show yet"
          body="Finish a debate and get a scorecard. Then this page tells you what to work on, based on what you actually found hard — not a guess."
        />
      ) : (
        <>
          <Card className="mb-3">
            <p className="text-sm leading-relaxed">
              These are your lowest average scores. Work on the top one first. The number is
              out of 5.
            </p>
          </Card>

          <ol className="grid gap-2">
            {weakest.map((stat, i) => {
              const { label, help, to } = labelFor(stat.tag)
              const pct = (stat.avg_score / 5) * 100
              const tone =
                stat.avg_score >= 4 ? 'bg-emerald-500' : stat.avg_score >= 3 ? 'bg-amber-500' : 'bg-red-500'

              const body = (
                <>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-2 font-semibold">
                      <span
                        aria-hidden="true"
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs text-white"
                      >
                        {i + 1}
                      </span>
                      {label}
                    </span>
                    <span className="text-sm font-bold tabular-nums">
                      {stat.avg_score.toFixed(1)}/5
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
                  </div>
                  {help && <p className="muted mt-1 text-xs leading-snug">{help}</p>}
                  <p className="muted mt-1 text-xs">
                    {stat.attempts} attempt{stat.attempts === 1 ? '' : 's'}
                  </p>
                </>
              )

              return (
                <li key={stat.tag}>
                  {to ? (
                    <Link to={to} className="card block p-3 hover:border-brand-400">
                      {body}
                      <Badge tone="brand">Read it ↗</Badge>
                    </Link>
                  ) : (
                    <Card>{body}</Card>
                  )}
                </li>
              )
            })}
          </ol>

          <div className="mt-4 grid gap-2">
            <Link to="/debate" className="btn btn-primary">
              Practise the weakest one
            </Link>
            <Link to="/learn/flashcards" className="btn btn-ghost">
              Or review with flashcards
            </Link>
          </div>

          {rest.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold muted">
                Everything else ({rest.length})
              </summary>
              <ul className="mt-2 grid gap-1 text-sm">
                {rest.map((stat) => {
                  const { label } = labelFor(stat.tag)
                  return (
                    <li key={stat.tag} className="flex justify-between gap-2">
                      <span>{label}</span>
                      <span className="muted tabular-nums">{stat.avg_score.toFixed(1)}/5</span>
                    </li>
                  )
                })}
              </ul>
            </details>
          )}
        </>
      )}
    </Page>
  )
}
