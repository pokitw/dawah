import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page, PageHeader, Card, EmptyState, Spinner, Badge } from '../components/ui'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { getBySlug, getByKey } from '../lib/content'
import { shortDate, difficultyTone } from '../lib/format'
import { bandFor } from '../lib/scoring'

interface Row {
  id: string
  persona_id: string
  difficulty: string
  topic: string | null
  user_plays_side: string
  created_at: string
  ended_at: string | null
  scorecards: { total: number }[] | null
}

export default function History() {
  const { user, offline } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase || !user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('debates')
        .select(
          'id, persona_id, difficulty, topic, user_plays_side, created_at, ended_at, scorecards(total)',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!cancelled) {
        setRows((data ?? []) as Row[])
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
        <PageHeader title="Debate history" back="/profile" />
        <Spinner />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader title="Debate history" subtitle={`${rows.length} debates`} back="/profile" />

      {offline && (
        <Card className="mb-3 border-amber-400 bg-amber-50 text-sm dark:bg-amber-950/30">
          <p className="muted">Not connected, so your history cannot be loaded.</p>
        </Card>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="No debates yet"
          body="Start one from the Debate tab. Every debate is saved here so you can read it again."
        />
      ) : (
        <ul className="grid gap-2">
          {rows.map((row) => {
            const persona = getBySlug(row.persona_id)
            const name = String((persona?.meta as { name?: string } | undefined)?.name ?? row.persona_id)
            const total = row.scorecards?.[0]?.total
            const topic = row.topic ? getByKey(row.topic) : undefined

            return (
              <li key={row.id}>
                <Card as="article">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{name}</span>
                        <Badge tone={difficultyTone(row.difficulty)}>{row.difficulty}</Badge>
                        {row.user_plays_side === 'atheist' && <Badge tone="warn">steelman</Badge>}
                      </div>
                      <p className="muted mt-0.5 text-xs">
                        {shortDate(row.created_at)}
                        {topic ? ` · ${row.topic}` : ''}
                        {!row.ended_at ? ' · still open' : ''}
                      </p>
                    </div>
                    {typeof total === 'number' && (
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-bold tabular-nums">{total}/30</p>
                        <p className="muted text-xs">{bandFor(total)}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      to={`/debate/${row.id}`}
                      className="btn btn-ghost !min-h-0 !py-1.5 text-xs"
                    >
                      Read it again
                    </Link>
                    {row.ended_at && (
                      <Link
                        to={`/debate/${row.id}/scorecard`}
                        className="btn btn-ghost !min-h-0 !py-1.5 text-xs"
                      >
                        Scorecard
                      </Link>
                    )}
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}
