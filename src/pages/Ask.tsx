import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Badge,
  Card,
  Disclaimer,
  ErrorNote,
  Page,
  PageHeader,
  Spinner,
} from '../components/ui'
import { Markdown } from '../components/Markdown'
import { askQuestion, type AskResponse } from '../lib/api'
import { getByKey, qaBank } from '../lib/content'
import { useAuth } from '../lib/auth'
import { checkSafetyLocal } from '../lib/safety'

const STARTERS = [
  'Who created God?',
  'If God is good, why is there evil?',
  'Can atheists be good without God?',
  'Why Islam and not another religion?',
]

export default function Ask() {
  const { offline } = useAuth()
  const [question, setQuestion] = useState('')
  const [asked, setAsked] = useState('')
  const [answer, setAnswer] = useState<AskResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [simplifying, setSimplifying] = useState(false)
  const [error, setError] = useState('')
  const [showSources, setShowSources] = useState(false)
  const answerRef = useRef<HTMLDivElement>(null)

  const run = useCallback(
    async (text: string, simpler = false, previous?: string) => {
      const clean = text.trim()
      if (!clean) return

      setError('')
      if (simpler) setSimplifying(true)
      else {
        setLoading(true)
        setAnswer(null)
        setShowSources(false)
        setAsked(clean)
      }

      // The same safety check the server runs, so a person in distress gets a
      // kind reply instantly even if the network is slow or offline.
      const safety = checkSafetyLocal(clean)
      if (safety.crisis) {
        setAnswer({
          answer_md: safety.reply,
          citations: [],
          confidence: 'answered',
          strength: 'not-applicable',
          safetyPause: true,
          warnings: [],
        })
        setLoading(false)
        setSimplifying(false)
        return
      }

      try {
        const result = await askQuestion({
          question: clean,
          explainSimpler: simpler,
          previousAnswer: previous,
        })
        setAnswer(result)
        requestAnimationFrame(() =>
          answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      } finally {
        setLoading(false)
        setSimplifying(false)
      }
    },
    [],
  )

  const busy = loading || simplifying

  return (
    <Page>
      <PageHeader title="Ask" subtitle="Simple answers, with real sources" />

      {offline && (
        <Card className="mb-4 border-amber-400 bg-amber-50 text-sm dark:bg-amber-950/30">
          <p className="font-semibold">The AI is not connected</p>
          <p className="muted mt-1 leading-relaxed">
            Add your Supabase keys to <code>.env</code> and deploy the edge functions to
            use this. You can still read every answer in the{' '}
            <Link to="/library" className="underline">
              Library
            </Link>
            .
          </p>
        </Card>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void run(question)
        }}
      >
        <label htmlFor="q" className="mb-1 block text-sm font-semibold">
          What do you want to ask?
        </label>
        <textarea
          id="q"
          className="field min-h-[6rem] resize-y"
          placeholder="Type any question about Islam, God, or an atheist argument…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={2000}
          disabled={busy}
        />
        <div className="mt-2 flex items-center gap-2">
          <button type="submit" className="btn btn-primary flex-1" disabled={busy || !question.trim()}>
            {loading ? 'Thinking…' : 'Ask'}
          </button>
          {question && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setQuestion('')}
              disabled={busy}
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {!answer && !loading && (
        <>
          <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide muted">
            Try one of these
          </h2>
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                className="chip hover:border-brand-400"
                onClick={() => {
                  setQuestion(s)
                  void run(s)
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide muted">
            Or read a ready answer
          </h2>
          <ul className="grid gap-2">
            {qaBank.slice(0, 6).map((row) => (
              <li key={row.slug}>
                <Link
                  to={`/library/${row.slug}`}
                  className="card block p-3 text-sm hover:border-brand-400"
                >
                  {row.title}
                </Link>
              </li>
            ))}
          </ul>
          <p className="muted mt-2 text-sm">
            <Link to="/library?kind=qa" className="underline">
              See all {qaBank.length} ready answers →
            </Link>
          </p>
        </>
      )}

      {loading && <Spinner label="Reading the research files" />}
      {error && (
        <div className="mt-4">
          <ErrorNote message={error} />
        </div>
      )}

      {answer && (
        <div ref={answerRef} className="mt-5 scroll-mt-20">
          {answer.safetyPause ? (
            <Card className="border-brand-400 bg-brand-50 dark:bg-brand-950/40">
              <Markdown text={answer.answer_md} />
            </Card>
          ) : (
            <>
              <Card>
                <p className="muted mb-2 text-xs">You asked: {asked}</p>

                <div className="mb-3 flex flex-wrap gap-2">
                  {answer.confidence === 'unsure' && (
                    <Badge tone="warn">Not fully sure — ask a scholar</Badge>
                  )}
                  {answer.confidence === 'scholars-differ' && (
                    <Badge tone="warn">Scholars differ on this</Badge>
                  )}
                  {answer.strength === 'strong-mainstream' && (
                    <Badge tone="good">Strong / mainstream answer</Badge>
                  )}
                  {answer.strength === 'weak-avoid' && (
                    <Badge tone="bad">Weak — better to avoid this line</Badge>
                  )}
                </div>

                <Markdown text={answer.answer_md} />

                {answer.warnings.map((w) => (
                  <p
                    key={w}
                    role="alert"
                    className="mt-3 rounded-lg border border-amber-400 bg-amber-50 p-2 text-xs dark:bg-amber-950/30"
                  >
                    ⚠️ {w}
                  </p>
                ))}

                <Disclaimer />
              </Card>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={busy}
                  onClick={() => void run(asked, true, answer.answer_md)}
                >
                  {simplifying ? 'Rewriting…' : '🧒 Explain simpler'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowSources((v) => !v)}
                  aria-expanded={showSources}
                >
                  📚 {showSources ? 'Hide' : 'Show'} sources ({answer.citations.length})
                </button>
              </div>

              {showSources && (
                <Card className="mt-3">
                  <h2 className="mb-2 text-sm font-bold">Where this comes from</h2>
                  {answer.citations.length === 0 ? (
                    <p className="muted text-sm">
                      No exact source was given for this answer. That usually means the
                      research files do not cover it. Please check with a scholar.
                    </p>
                  ) : (
                    <ul className="grid gap-2">
                      {answer.citations.map((c) => {
                        const row = getByKey(c.id)
                        return (
                          <li
                            key={c.id}
                            className="rounded-lg border border-[color:var(--line)] p-2 text-sm"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge tone="brand">{c.id}</Badge>
                              <span className="font-medium">{c.label}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-3 text-xs">
                              {row && (
                                <Link
                                  to={`/library/${row.slug}`}
                                  className="text-brand-700 underline dark:text-brand-300"
                                >
                                  Read it here
                                </Link>
                              )}
                              {c.url && (
                                <a
                                  href={c.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-700 underline dark:text-brand-300"
                                >
                                  Open the original ↗
                                </a>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}

                  {answer.usedSources && answer.usedSources.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-semibold muted">
                        Everything the AI was allowed to read ({answer.usedSources.length})
                      </summary>
                      <ul className="mt-2 grid gap-1 text-xs">
                        {answer.usedSources.map((s) => (
                          <li key={s.slug}>
                            <Link to={`/library/${s.slug}`} className="underline">
                              {s.id} — {s.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <p className="muted mt-2 text-xs">
                        The AI could only use these. Anything else it says is removed
                        before you see it.
                      </p>
                    </details>
                  )}
                </Card>
              )}
            </>
          )}

          <button
            type="button"
            className="btn btn-ghost mt-4 w-full"
            onClick={() => {
              setAnswer(null)
              setQuestion('')
              setAsked('')
            }}
          >
            Ask something else
          </button>
        </div>
      )}
    </Page>
  )
}
