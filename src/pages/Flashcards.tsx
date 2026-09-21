import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, EmptyState, Page, PageHeader, Spinner } from '../components/ui'
import { allFlashcards, type FlashcardRow } from '../lib/content'
import { useAuth } from '../lib/auth'
import {
  flashcardIds,
  loadReviewStates,
  saveReview,
  stateFor,
  awardXp,
} from '../lib/progress'
import { INTERVALS, pickDue, review, type ReviewState } from '../lib/srs'
import { todayISO } from '../lib/format'
import { xpForReviews } from '../lib/scoring'

type Deck = 'all' | 'core' | 'glossary' | 'qa' | 'fallacy'

const DECKS: { key: Deck; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'core', label: 'Core 10' },
  { key: 'glossary', label: 'Words' },
  { key: 'fallacy', label: 'Fallacies' },
  { key: 'qa', label: 'Q&A' },
]

export default function Flashcards() {
  const { user, refreshProfile, offline } = useAuth()
  const today = todayISO()

  const [deck, setDeck] = useState<Deck>('all')
  const [states, setStates] = useState<Map<string, ReviewState & { flashcard_id: string }>>(
    new Map(),
  )
  const [ids, setIds] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState<FlashcardRow[]>([])
  const [position, setPosition] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<{ correct: boolean }[]>([])
  const [finished, setFinished] = useState(false)

  const pool = useMemo(() => {
    if (deck === 'all') return allFlashcards
    return allFlashcards.filter((c) => c.tags.includes(deck))
  }, [deck])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) {
        setLoading(false)
        return
      }
      const loaded = await loadReviewStates(user.id)
      if (cancelled) return
      setStates(loaded)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user])

  const start = useCallback(async () => {
    const due = pickDue(pool, states, today, 20)
    setQueue(due)
    setPosition(0)
    setFlipped(false)
    setResults([])
    setFinished(due.length === 0)
    if (due.length && user) {
      setIds(await flashcardIds(due.map((c) => c.slug)))
    }
  }, [pool, states, today, user])

  useEffect(() => {
    if (!loading) void start()
    // Restarting when the deck changes is the point.
  }, [loading, deck]) // eslint-disable-line react-hooks/exhaustive-deps

  const answer = useCallback(
    async (correct: boolean) => {
      const card = queue[position]
      if (!card) return

      const before = stateFor(states, card.slug)
      const after = review(before, correct, today)

      setStates((prev) => {
        const next = new Map(prev)
        next.set(card.slug, {
          ...after,
          flashcard_id: prev.get(card.slug)?.flashcard_id ?? ids.get(card.slug) ?? '',
        })
        return next
      })

      const cardId = states.get(card.slug)?.flashcard_id ?? ids.get(card.slug)
      if (user && cardId) void saveReview(user.id, cardId, after)

      const nextResults = [...results, { correct }]
      setResults(nextResults)
      setFlipped(false)

      if (position + 1 < queue.length) {
        setPosition(position + 1)
      } else {
        setFinished(true)
        const earned = xpForReviews(nextResults)
        if (user && earned > 0) {
          await awardXp(earned)
          void refreshProfile()
        }
      }
    },
    [queue, position, states, ids, today, user, results, refreshProfile],
  )

  if (loading) {
    return (
      <Page>
        <PageHeader title="Flashcards" back="/learn" />
        <Spinner label="Loading your cards" />
      </Page>
    )
  }

  const card = queue[position]

  return (
    <Page>
      <PageHeader title="Flashcards" subtitle={`${pool.length} cards in this deck`} back="/learn" />

      <div className="mb-3 flex flex-wrap gap-2">
        {DECKS.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setDeck(d.key)}
            aria-pressed={deck === d.key}
            className={`chip ${
              deck === d.key ? 'border-brand-500 bg-brand-600 text-white' : 'hover:border-brand-400'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {offline && (
        <Card className="mb-3 border-amber-400 bg-amber-50 text-sm dark:bg-amber-950/30">
          <p className="muted">
            Not connected, so your reviews will not be remembered. You can still practise.
          </p>
        </Card>
      )}

      {finished ? (
        <>
          <Card className="text-center">
            {results.length > 0 ? (
              <>
                <p className="text-2xl font-bold">
                  {results.filter((r) => r.correct).length}/{results.length} right
                </p>
                <p className="muted mt-1 text-sm">
                  Nice. The ones you got wrong will come back tomorrow.
                </p>
              </>
            ) : (
              <EmptyState
                title="Nothing due right now 🎉"
                body="You are up to date on this deck. Come back tomorrow, or pick another deck above."
              />
            )}
          </Card>

          <Card className="mt-3">
            <h2 className="text-sm font-bold">How this works</h2>
            <p className="muted mt-1 text-sm leading-relaxed">
              A card you get right comes back after {INTERVALS.join(', ')} days, one step at a
              time. A card you get wrong goes back to the start and returns tomorrow. That way
              you spend your time on the ones you keep forgetting.
            </p>
          </Card>

          <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => void start()}>
            Go again
          </button>
          <Link to="/learn" className="btn btn-ghost mt-2 w-full">
            Back to Learn
          </Link>
        </>
      ) : card ? (
        <>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-brand-500 transition-[width]"
                style={{ width: `${(position / queue.length) * 100}%` }}
              />
            </div>
            <span className="muted text-xs tabular-nums">
              {position + 1}/{queue.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="card flex min-h-[14rem] w-full flex-col items-center justify-center p-5 text-center"
            aria-label={flipped ? 'Show the question again' : 'Show the answer'}
          >
            <p className="muted mb-2 text-xs font-semibold uppercase tracking-wide">
              {flipped ? 'Answer' : 'Question'}
            </p>
            <p className={flipped ? 'text-base leading-relaxed' : 'text-lg font-semibold leading-snug'}>
              {flipped ? card.back : card.front}
            </p>
            {!flipped && <p className="muted mt-4 text-xs">Tap to see the answer</p>}
          </button>

          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {card.tags.slice(0, 3).map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>

          {flipped ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn border border-red-400 text-red-700 dark:text-red-300"
                onClick={() => void answer(false)}
              >
                😕 Got it wrong
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void answer(true)}
              >
                🙂 Got it right
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-ghost mt-4 w-full"
              onClick={() => setFlipped(true)}
            >
              Show the answer
            </button>
          )}
        </>
      ) : null}
    </Page>
  )
}
