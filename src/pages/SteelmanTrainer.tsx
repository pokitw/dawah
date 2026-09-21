import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, Page, PageHeader } from '../components/ui'
import { Markdown } from '../components/Markdown'
import { steelmanTasks } from '../lib/trainers'
import { getBySlug } from '../lib/content'
import { useAuth } from '../lib/auth'
import { awardXp } from '../lib/progress'

export default function SteelmanTrainer() {
  const { user, refreshProfile } = useAuth()
  const tasks = useMemo(() => steelmanTasks(), [])
  const [index, setIndex] = useState(0)
  const [draft, setDraft] = useState('')
  const [revealed, setRevealed] = useState(false)

  const task = tasks[index]
  const row = getBySlug(task.slug)
  const response = Array.isArray(row?.meta?.response) ? (row.meta.response as string[]) : []

  function nextTask() {
    setDraft('')
    setRevealed(false)
    setIndex((i) => (i + 1) % tasks.length)
    if (user) void awardXp(4).then(() => refreshProfile())
  }

  return (
    <Page>
      <PageHeader
        title="Steelman Trainer"
        subtitle={`${index + 1} of ${tasks.length}`}
        back="/train"
      />

      <Card className="mb-3">
        <p className="muted text-xs leading-relaxed">
          <strong>Steelman</strong> means saying the other side&apos;s view in its strongest,
          fairest form — before you answer it. Do this and people trust you. It is also what
          Quran 16:125 asks for: argue in the best way.
        </p>
      </Card>

      <Card>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="brand">{task.code}</Badge>
          {task.who && <Badge>{task.who}</Badge>}
        </div>
        <h2 className="font-semibold leading-snug">{task.title}</h2>
        <p className="muted mt-2 text-sm">
          Write this objection as strongly and fairly as you can, in your own words. Do not
          answer it yet.
        </p>

        <label htmlFor="steel" className="sr-only">
          Your steelman
        </label>
        <textarea
          id="steel"
          className="field mt-2 min-h-[7rem] resize-y"
          placeholder="If I were them, my best case would be…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={revealed}
        />
      </Card>

      {!revealed ? (
        <button
          type="button"
          className="btn btn-primary mt-4 w-full"
          disabled={draft.trim().length < 20}
          onClick={() => setRevealed(true)}
        >
          {draft.trim().length < 20 ? 'Write a bit more first' : 'Compare with the research'}
        </button>
      ) : (
        <>
          <Card className="mt-3 border-brand-400">
            <h3 className="text-sm font-bold">How the research says it</h3>
            <p className="mt-1 text-sm leading-relaxed">{task.modelSteelman}</p>
          </Card>

          <Card className="mt-3">
            <h3 className="text-sm font-bold">What you wrote</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{draft}</p>
          </Card>

          <Card className="mt-3">
            <h3 className="text-sm font-bold">Check yourself</h3>
            <ul className="muted mt-1 grid gap-1 text-sm">
              <li>· Did you make their case as strong as they would?</li>
              <li>· Did you leave out the strongest part because it is hard?</li>
              <li>· Would they read yours and say &quot;yes, that is what I mean&quot;?</li>
            </ul>
          </Card>

          {response.length > 0 && (
            <Card className="mt-3 border-emerald-400">
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                Now the Islamic answer
              </h3>
              <Markdown
                text={response.map((r) => `- ${r}`).join('\n')}
                className="mt-1 text-sm"
              />
              <Link to={`/library/${task.slug}`} className="mt-2 inline-block">
                <Badge tone="brand">Read the whole page ↗</Badge>
              </Link>
            </Card>
          )}

          <button type="button" className="btn btn-primary mt-4 w-full" onClick={nextTask}>
            Next objection
          </button>
        </>
      )}
    </Page>
  )
}
