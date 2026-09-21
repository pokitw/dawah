import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, Page, PageHeader } from '../components/ui'
import { ANSWER_PAIRS, linkFor } from '../lib/trainers'
import { useAuth } from '../lib/auth'
import { awardXp } from '../lib/progress'

export default function WeakAnswerTrainer() {
  const { user, refreshProfile } = useAuth()
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<'strong' | 'weak' | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const pair = ANSWER_PAIRS[index]
  // Swap which side shows first so the answer is not always in one place.
  const strongFirst = useMemo(() => index % 2 === 0, [index])
  const options: ('strong' | 'weak')[] = strongFirst ? ['strong', 'weak'] : ['weak', 'strong']

  function next() {
    if (picked === 'strong') setScore((s) => s + 1)
    setPicked(null)
    if (index + 1 < ANSWER_PAIRS.length) {
      setIndex(index + 1)
    } else {
      setDone(true)
      const earned = (picked === 'strong' ? score + 1 : score) * 2 + 3
      if (user) void awardXp(earned).then(() => refreshProfile())
    }
  }

  if (done) {
    return (
      <Page>
        <PageHeader title="Spot the Weak Answer" back="/train" />
        <Card className="text-center">
          <p className="text-3xl font-bold tabular-nums">
            {score}/{ANSWER_PAIRS.length}
          </p>
          <p className="muted mt-2 text-sm">
            The weak answers here are not silly — they are the ones people actually use. That
            is what makes them worth knowing.
          </p>
        </Card>
        <button
          type="button"
          className="btn btn-primary mt-4 w-full"
          onClick={() => {
            setIndex(0)
            setScore(0)
            setDone(false)
          }}
        >
          Go again
        </button>
        <Link to="/train" className="btn btn-ghost mt-2 w-full">
          Other trainers
        </Link>
      </Page>
    )
  }

  const sourceLink = linkFor(pair.source)

  return (
    <Page>
      <PageHeader
        title="Which is stronger?"
        subtitle={`${index + 1} of ${ANSWER_PAIRS.length}`}
        back="/train"
      />

      <Card>
        <p className="font-semibold leading-snug">{pair.question}</p>
      </Card>

      <ul className="mt-3 grid gap-2">
        {options.map((which, n) => {
          const text = which === 'strong' ? pair.strong : pair.weak
          const reveal = picked !== null
          const tone = !reveal
            ? 'hover:border-brand-400'
            : which === 'strong'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
              : 'border-red-500 bg-red-50 dark:bg-red-950/40'
          return (
            <li key={which}>
              <button
                type="button"
                disabled={reveal}
                onClick={() => setPicked(which)}
                className={`w-full rounded-xl border border-[color:var(--line)] p-3 text-left text-sm ${tone}`}
              >
                <span className="muted mb-1 block text-xs font-semibold">
                  Answer {n === 0 ? 'A' : 'B'}
                </span>
                {text}
                {reveal && (
                  <span className="mt-2 block text-xs font-semibold">
                    {which === 'strong' ? '✅ Stronger' : '❌ Weaker'}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {picked !== null && (
        <Card className="mt-3" as="section">
          <p className="text-sm font-semibold">
            {picked === 'strong' ? '✅ Right' : '❌ Not that one'}
          </p>
          <p className="mt-1 text-sm leading-relaxed">{pair.why}</p>
          {sourceLink && (
            <Link to={sourceLink} className="mt-2 inline-block">
              <Badge tone="brand">{pair.source} ↗</Badge>
            </Link>
          )}
        </Card>
      )}

      <button
        type="button"
        className="btn btn-primary mt-4 w-full"
        disabled={picked === null}
        onClick={next}
      >
        {index + 1 < ANSWER_PAIRS.length ? 'Next' : 'Finish'}
      </button>
    </Page>
  )
}
