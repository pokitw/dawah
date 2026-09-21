import { Link, useParams } from 'react-router-dom'
import { Badge, Card, EmptyState, Page, PageHeader, Disclaimer } from '../components/ui'
import { Markdown } from '../components/Markdown'
import { ArgumentMap } from '../components/ArgumentMap'
import { moduleById, getBySlug, quizzesFor, codeOf, levels } from '../lib/content'
import { difficultyTone } from '../lib/format'

export default function Module() {
  const { id = '' } = useParams()
  const mod = moduleById(id)

  if (!mod) {
    return (
      <Page>
        <PageHeader title="Module" back="/learn" />
        <EmptyState title="Module not found" body="Go back and pick one from the list." />
      </Page>
    )
  }

  const level = levels.find((l) => l.level === mod.level)
  const pages = mod.slugs.map((slug) => getBySlug(slug)).filter((r): r is NonNullable<typeof r> => Boolean(r))
  const quiz = quizzesFor(mod.id)

  return (
    <Page>
      <PageHeader
        title={`Module ${mod.id}`}
        subtitle={level ? `Level ${level.level}: ${level.name}` : undefined}
        back="/learn"
      />

      <Card className="mb-4">
        <h2 className="font-bold leading-snug">{mod.title}</h2>
        <p className="muted mt-1 text-sm">
          Read the {pages.length} page{pages.length === 1 ? '' : 's'} below, then take the quiz.
        </p>
      </Card>

      {pages.length === 0 ? (
        <EmptyState
          title="No pages linked yet"
          body="This module points at the library. Use the Library tab to read around the topic."
        />
      ) : (
        <div className="grid gap-4">
          {pages.map((row) => (
            <Card key={row.slug} as="article">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{codeOf(row)}</Badge>
                <Badge tone={difficultyTone(row.difficulty)}>{row.difficulty}</Badge>
              </div>
              <h3 className="font-semibold leading-snug">
                {row.title.replace(/^(ARG|OBJ|P)-?\d+[:—-]\s*/, '')}
              </h3>
              <Markdown text={row.body_md} className="mt-1 text-[0.95rem]" />
              {row.kind === 'argument' && <ArgumentMap row={row} />}
              <Link
                to={`/library/${row.slug}`}
                className="muted mt-2 inline-block text-xs underline"
              >
                Open this on its own page →
              </Link>
            </Card>
          ))}
        </div>
      )}

      {quiz.length > 0 && (
        <Link to={`/learn/quiz/${mod.id}`} className="btn btn-primary mt-5 w-full">
          Take the quiz ({quiz.length} questions)
        </Link>
      )}

      <Disclaimer />
    </Page>
  )
}
