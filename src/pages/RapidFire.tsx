import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, Page, PageHeader } from '../components/ui'
import { rapidCards, linkFor } from '../lib/trainers'
import { useAuth } from '../lib/auth'
import { awardXp } from '../lib/progress'
import { xpForReviews } from '../lib/scoring'

const SECONDS = 30
const ROUND = 8

export default function RapidFire() {
  const { user, refreshProfile } = useAuth()
  const [difficulty, setDifficulty] = useState<string>('easy')
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [left, setLeft] = useState(SECONDS)
  const [results, setResults] = useState<{ correct: boolean }[]>([])
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const deck = useMemo(() => {
    const pool = rapidCards(difficulty)
    // Shuffle a fresh order each time the deck is built.
    return [...pool].sort(() => Math.random() - 0.5).slice(0, ROUND)
  }, [difficulty])

  const stopTimer = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current)
      timer.current = null
    }
  }, [])

  useEffect(() => stopTimer, [stopTimer])

  const reveal = useCallback(() => {
    stopTimer()
    setRevealed(true)
  }, [stopTimer])

  const startTimer = useCallback(() => {
    stopTimer()
    setLeft(SECONDS)
    timer.current = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          stopTimer()
          setRevealed(true)
          return 0
        }
        return v - 1
      })
    }, 1000)
  }, [stopTimer])

  function begin() {
    setStarted(true)
    setIndex(0)
    setResults([])
    setRevealed(false)
    startTimer()
  }

  function score(correct: boolean) {
    const next = [...results, { correct }]
    setResults(next)
    if (index + 1 < deck.length) {
      setIndex(index + 1)
      setRevealed(false)
      startTimer()
    } else {
      setStarted(false)
      stopTimer()
      const earned = xpForReviews(next)
      if (user && earned > 0) void awardXp(earned).then(() => refreshProfile())
    }
  }

  if (!started && results.length > 0) {
    const right = results.filter((r) => r.correct).length
    return (
      <Page>
        <PageHeader title="Rapid-Fire" back="/train" />
        <Card className="text-center">
          <p className="text-3xl font-bold tabular-nums">
            {right}/{results.length}
          </p>
          <p className="muted mt-2 text-sm">
            Speed is not the point on its own. The point is that the answer is there when you
            need it, so you can stay calm.
          </p>
        </Card>
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={begin}>
          Go again
        </button>
        <Link to="/train" className="btn btn-ghost mt-2 w-full">
          Other trainers
        </Link>
      </Page>
    )
  }

  if (!started) {
    return (
      <Page>
        <PageHeader title="Rapid-Fire" subtitle="Short answers against the clock" back="/train" />
        <Card>
          <p className="text-sm leading-relaxed">
            You get <strong>{SECONDS} seconds</strong> per question. Answer it out loud or in
            your head, then check yourself against the model answer. {ROUND} questions.
          </p>
          <p className="muted mt-2 text-sm">Be honest when you mark yourself. It only helps you.</p>
        </Card>

        <h2 className="mb-2 mt-4 text-sm font-bold uppercase tracking-wide muted">
          How hard?
        </h2>
        <div className="flex flex-wrap gap-2">
          {['easy', 'medium', 'hard', 'expert'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              aria-pressed={difficulty === d}
              className={`chip ${
                difficulty === d
                  ? 'border-brand-500 bg-brand-600 text-white'
                  : 'hover:border-brand-400'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-primary mt-4 w-full"
          onClick={begin}
          disabled={deck.length === 0}
        >
          {deck.length === 0 ? 'No questions at this level' : `Start (${deck.length} questions)`}
        </button>
      </Page>
    )
  }

  const card = deck[index]
  const urgent = left <= 10

  return (
    <Page>
      <PageHeader title={`${index + 1} of ${deck.length}`} back="/train" />

      <div className="mb-3 flex items-center gap-3">
        <div
          className={`text-2xl font-bold tabular-nums ${urgent ? 'text-red-600 dark:text-red-400' : ''}`}
          role="timer"
          aria-live="off"
        >
          {left}s
        </div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className={`h-full rounded-full transition-[width] ${urgent ? 'bg-red-500' : 'bg-brand-500'}`}
            style={{ width: `${(left / SECONDS) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <p className="text-lg font-semibold leading-snug">{card.question}</p>
        {!revealed && (
          <button type="button" className="btn btn-ghost mt-4 w-full" onClick={reveal}>
            I have my answer — show me
          </button>
        )}
      </Card>

      {revealed && (
        <>
          <Card className="mt-3 border-brand-400">
            <p className="muted text-xs font-semibold uppercase tracking-wide">Model answer</p>
            <p className="mt-1 text-sm leading-relaxed">{card.answer}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {card.cites.map((cite) => {
                const to = linkFor(cite)
                return to ? (
                  <Link key={cite} to={to}>
                    <Badge tone="brand">{cite} ↗</Badge>
                  </Link>
                ) : (
                  <Badge key={cite}>{cite}</Badge>
                )
              })}
            </div>
          </Card>

          <p className="muted mt-3 text-center text-sm">Did you get the main idea?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn border border-red-400 text-red-700 dark:text-red-300"
              onClick={() => score(false)}
            >
              Not really
            </button>
            <button type="button" className="btn btn-primary" onClick={() => score(true)}>
              Yes
            </button>
          </div>
        </>
      )}
    </Page>
  )
}
