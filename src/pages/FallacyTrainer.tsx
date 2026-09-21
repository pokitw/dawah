import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, Page, PageHeader } from '../components/ui'
import { fallacyQuestions } from '../lib/trainers'
import { useAuth } from '../lib/auth'
import { awardXp } from '../lib/progress'

export default function FallacyTrainer() {
  const { user, refreshProfile } = useAuth()
  const questions = useMemo(() => fallacyQuestions(), [])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const q = questions[index]
  const right = picked === q?.answerSlug

  function next() {
    if (right) setScore((s) => s + 1)
    setPicked(null)
    if (index + 1 < questions.length) {
      setIndex(index + 1)
    } else {
      setDone(true)
      const earned = (right ? score + 1 : score) * 2 + 3
      if (user) {
        void awardXp(earned).then(() => refreshProfile())
      }
    }
  }

  if (done) {
    return (
      <Page>
        <PageHeader title="Fallacy Trainer" back="/train" />
        <Card className="text-center">
          <p className="text-3xl font-bold tabular-nums">
            {score}/{questions.length}
          </p>
          <p className="muted mt-2 text-sm">
            Naming the mistake is half the answer. Once you can name it, you can explain it
            calmly instead of getting annoyed.
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

  return (
    <Page>
      <PageHeader title="Spot the fallacy" subtitle={`${index + 1} of ${questions.length}`} back="/train" />

      <Card>
        <p className="muted mb-2 text-xs font-semibold uppercase tracking-wide">
          Someone says to you:
        </p>
        <blockquote className="rounded-xl border-l-4 border-brand-400 bg-black/5 p-3 text-base italic dark:bg-white/10">
          {q.line}
        </blockquote>

        <p className="mt-4 text-sm font-semibold">Which mistake is this?</p>
        <ul className="mt-2 grid gap-2">
          {q.choices.map((choice) => {
            const chosen = picked === choice.slug
            const reveal = picked !== null
            const tone = !reveal
              ? 'hover:border-brand-400'
              : choice.slug === q.answerSlug
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                : chosen
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/40'
                  : 'opacity-60'
            return (
              <li key={choice.slug}>
                <button
                  type="button"
                  disabled={reveal}
                  onClick={() => setPicked(choice.slug)}
                  className={`w-full rounded-xl border border-[color:var(--line)] p-3 text-left text-sm ${tone}`}
                >
                  {choice.name}
                </button>
              </li>
            )
          })}
        </ul>

        {picked !== null && (
          <div role="status" className="mt-3 rounded-xl border border-[color:var(--line)] p-3 text-sm">
            <p className="font-semibold">
              {right ? '✅ Yes' : `❌ It is the ${q.answerName}`}
            </p>
            <p className="mt-1">{q.explanation}</p>
            <Link to={`/library/${q.answerSlug}`} className="mt-2 inline-block">
              <Badge tone="brand">Read about it ↗</Badge>
            </Link>
          </div>
        )}
      </Card>

      <button
        type="button"
        className="btn btn-primary mt-4 w-full"
        disabled={picked === null}
        onClick={next}
      >
        {index + 1 < questions.length ? 'Next' : 'Finish'}
      </button>
    </Page>
  )
}
