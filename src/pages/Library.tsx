import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge, Card, Page, PageHeader, EmptyState } from '../components/ui'
import {
  allContent,
  argumentsList,
  codeOf,
  objections,
  qaBank,
  searchContent,
  type ContentRow,
} from '../lib/content'
import { difficultyTone } from '../lib/format'

type Filter = 'argument' | 'objection' | 'qa' | 'all'

const TABS: { key: Filter; label: string; count: number }[] = [
  { key: 'argument', label: 'Arguments', count: argumentsList.length },
  { key: 'objection', label: 'Objections', count: objections.length },
  { key: 'qa', label: 'Q&A', count: qaBank.length },
  { key: 'all', label: 'Everything', count: allContent.length },
]

function Row({ row }: { row: ContentRow }) {
  return (
    <li>
      <Link
        to={`/library/${row.slug}`}
        className="card block p-3 transition-colors hover:border-brand-400"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{codeOf(row)}</Badge>
          <Badge tone={difficultyTone(row.difficulty)}>{row.difficulty}</Badge>
        </div>
        <p className="mt-1.5 text-sm font-medium leading-snug">
          {row.title.replace(/^(ARG|OBJ|P)-?\d+[:—-]\s*/, '')}
        </p>
      </Link>
    </li>
  )
}

export default function Library() {
  const [params, setParams] = useSearchParams()
  const kind = (params.get('kind') as Filter) || 'argument'
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    if (query.trim()) return searchContent(query, 40)
    if (kind === 'all') return allContent
    return allContent.filter((r) => r.kind === kind)
  }, [kind, query])

  return (
    <Page>
      <PageHeader title="Library" subtitle="Every argument, objection and answer" />

      <input
        type="search"
        className="field mb-3"
        placeholder="Search… (try &quot;kalam&quot;, &quot;evil&quot;, or &quot;ARG-2&quot;)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search the library"
      />

      {!query && (
        <div className="mb-3 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setParams({ kind: tab.key })}
              aria-pressed={kind === tab.key}
              className={`chip ${
                kind === tab.key
                  ? 'border-brand-500 bg-brand-600 text-white'
                  : 'hover:border-brand-400'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing found"
          body="Try a different word, or an id like ARG-2 or OBJ-6."
        />
      ) : (
        <ul className="grid gap-2">
          {rows.map((row) => (
            <Row key={row.slug} row={row} />
          ))}
        </ul>
      )}

      <Card className="mt-4">
        <h2 className="text-sm font-bold">Other places to look</h2>
        <ul className="mt-2 grid gap-1 text-sm">
          <li>
            <Link to="/glossary" className="underline">
              Glossary — every hard word explained
            </Link>
          </li>
          <li>
            <Link to="/sources" className="underline">
              Source library — the real Quran, hadith and fatwa links
            </Link>
          </li>
        </ul>
      </Card>
    </Page>
  )
}
