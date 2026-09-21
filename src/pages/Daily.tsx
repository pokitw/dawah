import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Page, PageHeader, Card, Badge } from '../components/ui'
import { Markdown } from '../components/Markdown'
import { dailyChallenge } from '../lib/trainers'
import { todayISO, shortDate } from '../lib/format'
import { useAuth } from '../lib/auth'
import type { ContentRow } from '../lib/content'

export default function Daily() {
  const { profile } = useAuth()
  const today = todayISO()
  const challenge = useMemo(() => dailyChallenge(today), [today])

  const qaRow =
    challenge.kind === 'qa' ? (challenge.item as ContentRow | undefined) : undefined

  return (
    <Page>
      <PageHeader title="Daily Challenge" subtitle={shortDate(today)} back="/learn" />

      <Card className="mb-3 bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <p className="text-sm opacity-90">{challenge.title}</p>
        <p className="mt-1 leading-relaxed">{challenge.brief}</p>
        {profile && (
          <p className="mt-3 text-sm opacity-90">
            🔥 {profile.streak_count} day streak — keep it going.
          </p>
        )}
      </Card>

      {qaRow && (
        <Card>
          <Badge tone="brand">{String(qaRow.meta?.code ?? '')}</Badge>
          <h2 className="mt-2 font-semibold leading-snug">
            {String(qaRow.meta?.question ?? qaRow.title)}
          </h2>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold text-brand-700 dark:text-brand-300">
              Try it yourself first — then tap to check
            </summary>
            <Markdown
              text={String(qaRow.meta?.answer ?? '')}
              className="mt-2 text-sm"
            />
          </details>
        </Card>
      )}

      <Link to={challenge.to} className="btn btn-primary mt-4 w-full">
        {challenge.kind === 'qa' ? 'Open the full page' : 'Start the challenge'}
      </Link>

      <Card className="mt-4">
        <p className="muted text-sm leading-relaxed">
          A new challenge appears every day. Doing one small thing daily beats one big push
          once a month.
        </p>
      </Card>
    </Page>
  )
}
