import { Page, PageHeader, Card } from '../components/ui'

export default function Ask() {
  return (
    <Page>
      <PageHeader title="Ask" subtitle="Simple answers with real sources" />
      <Card>
        <p className="muted text-sm">Q&amp;A mode is built in Phase 3.</p>
      </Card>
    </Page>
  )
}
