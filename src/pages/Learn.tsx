import { Page, PageHeader, Card } from '../components/ui'

export default function Learn() {
  return (
    <Page>
      <PageHeader title="Learn" subtitle="Lessons, quizzes and flashcards" />
      <Card>
        <p className="muted text-sm">The learning path is built in Phase 5.</p>
      </Card>
    </Page>
  )
}
