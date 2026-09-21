import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, Page, PageHeader, LinkCard } from '../components/ui'
import { levels, quizzesFor, allFlashcards } from '../lib/content'
import { useAuth } from '../lib/auth'
import { loadQuizHistory, passedModules, loadReviewStates } from '../lib/progress'
import { isDue } from '../lib/srs'
import { todayISO } from '../lib/format'

export default function Learn() {
  const { user, profile } = useAuth()
  const [passed, setPassed] = useState<Set<string>>(new Set())
  const [dueCount, setDueCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) return
      const [history, states] = await Promise.all([
        loadQuizHistory(user.id),
        loadReviewStates(user.id),
      ])
      if (cancelled) return
      setPassed(passedModules(history))

      const today = todayISO()
      let due = 0
      for (const card of allFlashcards) {
        const state = states.get(card.slug)
        if (!state || isDue(state, today)) due++
      }
      setDueCount(due)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user])

  const currentLevel = profile?.level ?? 1

  return (
    <Page>
      <PageHeader title="Learn" subtitle="Lessons, quizzes and flashcards" />

      <div className="mb-4 grid gap-3">
        <LinkCard
          to="/learn/flashcards"
          emoji="🃏"
          title="Flashcards"
          description="Quick review with spaced repetition. The app decides what you see today."
          badge={dueCount !== null ? `${dueCount} due` : undefined}
        />
        <LinkCard
          to="/daily"
          emoji="⭐"
          title="Daily Challenge"
          description="One question a day. Keeps your streak alive."
        />
        <LinkCard
          to="/train"
          emoji="🏋️"
          title="Trainers"
          description="Spot the fallacy, pick the stronger answer, steelman, rapid-fire."
        />
      </div>

      <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide muted">
        The course
      </h2>

      <div className="grid gap-4">
        {levels.map((level) => {
          const done = level.modules.filter((m) => passed.has(m.id)).length
          const locked = level.level > currentLevel + 1
          return (
            <Card key={level.level} className={locked ? 'opacity-60' : ''}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold">
                  Level {level.level}: {level.name}
                </h3>
                {done === level.modules.length && done > 0 && <Badge tone="good">Done</Badge>}
                {locked && <Badge>Locked for now</Badge>}
              </div>

              {level.goals && (
                <p className="muted mt-1 text-sm leading-relaxed">{level.goals}</p>
              )}

              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${(done / level.modules.length) * 100}%` }}
                  />
                </div>
                <span className="muted text-xs tabular-nums">
                  {done}/{level.modules.length}
                </span>
              </div>

              <ul className="mt-3 grid gap-2">
                {level.modules.map((mod) => (
                  <li key={mod.id}>
                    <Link
                      to={`/learn/module/${mod.id}`}
                      className="flex items-center gap-2 rounded-lg border border-[color:var(--line)] p-2 text-sm hover:border-brand-400"
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          passed.has(mod.id)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-black/10 dark:bg-white/10'
                        }`}
                      >
                        {passed.has(mod.id) ? '✓' : mod.id}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block leading-snug">{mod.title}</span>
                        <span className="muted text-xs">
                          {mod.slugs.length} page{mod.slugs.length === 1 ? '' : 's'} ·{' '}
                          {quizzesFor(mod.id).length} quiz questions
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {level.checkpoint && (
                <p className="mt-3 rounded-lg border border-brand-300 bg-brand-50 p-2 text-xs dark:border-brand-800 dark:bg-brand-950/40">
                  <strong>Checkpoint:</strong> {level.checkpoint}
                </p>
              )}
            </Card>
          )
        })}
      </div>
    </Page>
  )
}
