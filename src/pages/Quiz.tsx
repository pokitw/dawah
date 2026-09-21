import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Card, EmptyState, Page, PageHeader } from '../components/ui'
import { Markdown } from '../components/Markdown'
import { quizzesFor, moduleById, getByKey, codeOf } from '../lib/content'
import { useAuth } from '../lib/auth'
import { awardXp, saveQuizResult } from '../lib/progress'
import { xpForQuiz } from '../lib/scoring'

export default function Quiz() {
  const { id = '' } = useParams()
  const { user, refreshProfile } = useAuth()
  const mod = moduleById(id)
  const questions = useMemo(() => quizzesFor(id), [id])

  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [done, setDone] = useState(false)
  const [xp, setXp] = useState(0)

  if (!mod || questions.length === 0) {
    return (
      <Page>
        <PageHeader title="Quiz" back="/learn" />
        <EmptyState title="No quiz here" body="This module has no questions yet." />
      </Page>
    )
  }

  const question = questions[index]
  const correct = question.choices.find((c) => c.correct)
  const isRight = picked !== null && picked === correct?.key

  async function finish(results: boolean[]) {
    setDone(true)
    const score = results.filter(Boolean).length
    const earned = xpForQuiz(score, results.length)
    setXp(earned)
    if (user) {
      await saveQuizResult(user.id, id, score, results.length)
      await awardXp(earned)
      void refreshProfile()
    }
  }

  function next() {
    const results = [...answers, isRight]
    setAnswers(results)
    setPicked(null)
    if (index + 1 < questions.length) {
      setIndex(index + 1)
    } else {
      void finish(results)
    }
  }

  if (done) {
    const score = answers.filter(Boolean).length
    const pct = Math.round((score / answers.length) * 100)
    const passedIt = pct >= 70

    return (
      <Page>
        <PageHeader title="Quiz finished" back="/learn" />
        <Card className="text-center">
          <p className="text-4xl font-bold tabular-nums">
            {score}
            <span className="muted text-xl">/{answers.length}</span>
          </p>
          <div className="mt-2 flex justify-center">
            <Badge tone={passedIt ? 'good' : 'warn'}>
              {passedIt ? 'Passed' : 'Try again to pass'}
            </Badge>
          </div>
          {xp > 0 && <p className="muted mt-2 text-sm">+{xp} XP</p>}
          <p className="muted mt-3 text-sm leading-relaxed">
            {passedIt
              ? 'Well done. Move on to the next module, or practise it in a debate.'
              : 'Read the module again and come back. Getting it wrong is part of learning.'}
          </p>
        </Card>

        <div className="mt-4 grid gap-2">
          <Link to={`/learn/module/${id}`} className="btn btn-ghost">
            Read the module again
          </Link>
          <Link to="/debate" className="btn btn-primary">
            Practise it in a debate
          </Link>
          <Link to="/learn" className="btn btn-ghost">
            Back to the course
          </Link>
        </div>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader title={`Quiz ${mod.id}`} subtitle={mod.title} back={`/learn/module/${id}`} />

      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-brand-500 transition-[width]"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
        </div>
        <span className="muted text-xs tabular-nums">
          {index + 1}/{questions.length}
        </span>
      </div>

      <Card>
        <h2 className="font-semibold leading-snug">{question.question}</h2>

        <ul className="mt-3 grid gap-2">
          {question.choices.map((choice) => {
            const chosen = picked === choice.key
            const reveal = picked !== null
            const tone = !reveal
              ? 'hover:border-brand-400'
              : choice.correct
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                : chosen
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/40'
                  : 'opacity-60'

            return (
              <li key={choice.key}>
                <button
                  type="button"
                  disabled={reveal}
                  onClick={() => setPicked(choice.key)}
                  className={`w-full rounded-xl border border-[color:var(--line)] p-3 text-left text-sm transition-colors ${tone}`}
                >
                  <span className="font-semibold">{choice.key})</span> {choice.text}
                  {reveal && choice.correct && <span aria-hidden="true"> ✅</span>}
                  {reveal && chosen && !choice.correct && <span aria-hidden="true"> ❌</span>}
                </button>
              </li>
            )
          })}
        </ul>

        {picked !== null && (
          <div
            role="status"
            className="mt-3 rounded-xl border border-[color:var(--line)] p-3 text-sm"
          >
            <p className="font-semibold">
              {isRight ? '✅ Correct' : `❌ Not quite — the answer is ${correct?.key}`}
            </p>
            <Markdown text={question.explanation} className="mt-1" />

            {question.cites.length > 0 && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="muted">Read more:</span>
                {question.cites.map((cite) => {
                  const row = getByKey(cite)
                  return row ? (
                    <Link key={cite} to={`/library/${row.slug}`}>
                      <Badge tone="brand">{codeOf(row)} ↗</Badge>
                    </Link>
                  ) : (
                    <Badge key={cite}>{cite}</Badge>
                  )
                })}
              </p>
            )}

            <p className="muted mt-2 text-[0.7rem]">
              {question.origin === '08'
                ? 'This question is written in 08-learning-path.md.'
                : 'This question was built from the research files above.'}
            </p>
          </div>
        )}
      </Card>

      <button
        type="button"
        className="btn btn-primary mt-4 w-full"
        disabled={picked === null}
        onClick={next}
      >
        {index + 1 < questions.length ? 'Next question' : 'Finish'}
      </button>
    </Page>
  )
}
