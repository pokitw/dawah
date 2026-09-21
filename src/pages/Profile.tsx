import { Page, PageHeader, Card } from '../components/ui'
import { useAuth } from '../lib/auth'

export default function Profile() {
  const { profile, offline } = useAuth()
  return (
    <Page>
      <PageHeader title="Profile" subtitle="Your progress" />
      <Card>
        <p className="text-sm">
          {offline ? 'Running offline — progress is not saved.' : `XP: ${profile?.xp ?? 0}`}
        </p>
      </Card>
    </Page>
  )
}
