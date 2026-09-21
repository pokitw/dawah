import { useMemo, useState } from 'react'
import { Page, PageHeader, Card, EmptyState, Badge } from '../components/ui'
import { Markdown } from '../components/Markdown'
import { glossary, fallacies } from '../lib/content'

export default function Glossary() {
  const [query, setQuery] = useState('')
  const [showFallacies, setShowFallacies] = useState(false)

  const list = showFallacies ? fallacies : glossary
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (row) =>
        row.title.toLowerCase().includes(q) || row.body_md.toLowerCase().includes(q),
    )
  }, [list, query])

  return (
    <Page>
      <PageHeader title="Glossary" subtitle="Every hard word, in simple English" back="/library" />

      <input
        type="search"
        className="field mb-3"
        placeholder="Search a word…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search the glossary"
      />

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setShowFallacies(false)}
          aria-pressed={!showFallacies}
          className={`chip ${!showFallacies ? 'border-brand-500 bg-brand-600 text-white' : ''}`}
        >
          Words ({glossary.length})
        </button>
        <button
          type="button"
          onClick={() => setShowFallacies(true)}
          aria-pressed={showFallacies}
          className={`chip ${showFallacies ? 'border-brand-500 bg-brand-600 text-white' : ''}`}
        >
          Fallacies ({fallacies.length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No word found" body="Try a different spelling." />
      ) : (
        <dl className="grid gap-2">
          {filtered.map((row) => (
            <Card key={row.slug} as="div">
              <dt className="flex flex-wrap items-center gap-2 font-semibold">
                {row.title}
                {row.tags.includes('fallacy') && <Badge tone="bad">fallacy</Badge>}
              </dt>
              <dd className="mt-0.5">
                <Markdown text={row.body_md} className="text-sm" />
              </dd>
            </Card>
          ))}
        </dl>
      )}
    </Page>
  )
}
