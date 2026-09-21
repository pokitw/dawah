import { Link, useParams } from 'react-router-dom'
import { Badge, Card, Page, PageHeader, EmptyState, Disclaimer } from '../components/ui'
import { Markdown } from '../components/Markdown'
import { ArgumentMap } from '../components/ArgumentMap'
import { getBySlug, getByKey, codeOf, urlsOf, allContent } from '../lib/content'
import { difficultyTone } from '../lib/format'
import { NoteButton } from '../components/NoteButton'

export default function LibraryItem() {
  const { slug = '' } = useParams()
  const row = getBySlug(slug)

  if (!row) {
    return (
      <Page>
        <PageHeader title="Not found" back="/library" />
        <EmptyState
          title="That page does not exist"
          body="It may have been renamed. Go back to the library and search for it."
        />
      </Page>
    )
  }

  const code = codeOf(row)
  const urls = urlsOf(row)
  const linked = row.tags
    .filter((t) => /^(ARG|OBJ|QA)-\d+$/.test(t) && t !== code)
    .map((t) => getByKey(t))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))

  // Personas link to the objections they like to use.
  const favourites = Array.isArray(row.meta?.favourite_objections)
    ? (row.meta.favourite_objections as string[])
        .map((id) => getByKey(id))
        .filter((r): r is NonNullable<typeof r> => Boolean(r))
    : []

  const relatedPersonas =
    row.kind === 'objection'
      ? allContent.filter(
          (r) =>
            r.kind === 'persona' &&
            Array.isArray(r.meta?.favourite_objections) &&
            (r.meta.favourite_objections as string[]).includes(code),
        )
      : []

  return (
    <Page>
      <PageHeader title={code} subtitle={row.kind} back="/library" />

      <Card>
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge tone="brand">{code}</Badge>
          <Badge tone={difficultyTone(row.difficulty)}>{row.difficulty}</Badge>
          {row.meta?.who != null && <Badge>{String(row.meta.who)}</Badge>}
        </div>

        <h2 className="text-lg font-bold leading-snug">
          {row.title.replace(/^(ARG|OBJ|P)-?\d+[:—-]\s*/, '')}
        </h2>

        <Markdown text={row.body_md} className="mt-2 text-[0.95rem]" />

        <div className="mt-3">
          <NoteButton linkedSlug={row.slug} title={row.title} />
        </div>
      </Card>

      {row.kind === 'argument' && <ArgumentMap row={row} />}

      {row.kind === 'persona' && (
        <Card className="mt-3">
          <h2 className="text-sm font-bold">Practise against them</h2>
          <p className="muted mt-1 text-sm">
            Start a debate where the AI plays this person.
          </p>
          <Link to={`/debate?persona=${row.slug}`} className="btn btn-primary mt-3 w-full">
            Debate {String(row.meta?.name ?? code)}
          </Link>
        </Card>
      )}

      {(linked.length > 0 || favourites.length > 0 || relatedPersonas.length > 0) && (
        <Card className="mt-3">
          <h2 className="text-sm font-bold">Connected pages</h2>
          <ul className="mt-2 grid gap-1 text-sm">
            {[...linked, ...favourites].map((r) => (
              <li key={r.slug}>
                <Link to={`/library/${r.slug}`} className="underline">
                  {codeOf(r)} — {r.title.replace(/^(ARG|OBJ|P)-?\d+[:—-]\s*/, '')}
                </Link>
              </li>
            ))}
            {relatedPersonas.map((r) => (
              <li key={r.slug}>
                <Link to={`/library/${r.slug}`} className="underline">
                  {codeOf(r)} — {String(r.meta?.name ?? '')} likes to use this
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {urls.length > 0 && (
        <Card className="mt-3">
          <h2 className="text-sm font-bold">Read the real sources</h2>
          <ul className="mt-2 grid gap-1 text-sm">
            {urls.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-brand-700 underline dark:text-brand-300"
                >
                  {url.replace(/^https?:\/\//, '').slice(0, 70)} ↗
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Disclaimer />
    </Page>
  )
}
