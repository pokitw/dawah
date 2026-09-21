import { useMemo, useState } from 'react'
import { Page, PageHeader, Card, Badge, EmptyState } from '../components/ui'
import { Markdown } from '../components/Markdown'
import { sources, urlsOf, allowList } from '../lib/content'

const GROUPS: { tag: string; label: string; note: string }[] = [
  { tag: 'quran', label: 'Quran', note: 'The verses this app is allowed to quote.' },
  { tag: 'hadith', label: 'Hadith', note: 'With collection, number and grading.' },
  { tag: 'fatwa', label: 'Fatwas', note: 'islamqa answers, by id.' },
  { tag: 'paper', label: 'Papers', note: 'Yaqeen and Sapience.' },
  { tag: 'academic', label: 'Academic', note: 'SEP and IEP — for the atheist side, said fairly.' },
  { tag: 'book', label: 'Classical books', note: 'For going deeper.' },
  { tag: 'honesty-flag', label: 'Honesty flags', note: 'Mistakes the research warns against.' },
]

export default function Sources() {
  const [group, setGroup] = useState('quran')
  const rows = useMemo(() => sources.filter((r) => r.tags.includes(group)), [group])
  const active = GROUPS.find((g) => g.tag === group)

  return (
    <Page>
      <PageHeader title="Source Library" subtitle="The real, checkable sources" back="/library" />

      <Card className="mb-3">
        <p className="text-sm leading-relaxed">
          This is the whole list the AI is allowed to cite. It comes from{' '}
          <code>03-islamic-sources.md</code>. If something is not here, the app will say
          &quot;I&apos;m not fully sure&quot; instead of guessing.
        </p>
        <p className="muted mt-2 text-xs">
          {allowList.quranRefs.length} verses · {allowList.hadith.length} hadith references ·{' '}
          {allowList.islamqaIds.length} fatwa ids · {allowList.urls.length} links
        </p>
      </Card>

      <div className="mb-3 flex flex-wrap gap-2">
        {GROUPS.map((g) => {
          const count = sources.filter((r) => r.tags.includes(g.tag)).length
          return (
            <button
              key={g.tag}
              type="button"
              onClick={() => setGroup(g.tag)}
              aria-pressed={group === g.tag}
              className={`chip ${
                group === g.tag ? 'border-brand-500 bg-brand-600 text-white' : 'hover:border-brand-400'
              }`}
            >
              {g.label} ({count})
            </button>
          )
        })}
      </div>

      {active && <p className="muted mb-2 text-sm">{active.note}</p>}

      {rows.length === 0 ? (
        <EmptyState title="Nothing here" body="Pick another group above." />
      ) : (
        <ul className="grid gap-2">
          {rows.map((row) => {
            const urls = urlsOf(row)
            return (
              <li key={row.slug}>
                <Card as="article">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={row.tags.includes('honesty-flag') ? 'warn' : 'brand'}>
                      {row.tags.includes('honesty-flag') ? '⚠️ flag' : active?.label}
                    </Badge>
                  </div>
                  <Markdown text={row.body_md} className="mt-1 text-sm" />
                  {urls.length > 0 && (
                    <ul className="mt-2 grid gap-1">
                      {urls.map((url) => (
                        <li key={url}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-xs text-brand-700 underline dark:text-brand-300"
                          >
                            {url.replace(/^https?:\/\//, '')} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}
