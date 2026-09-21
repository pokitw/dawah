import { Page, PageHeader, Card, LinkCard, Disclaimer } from '../components/ui'
import { useAuth } from '../lib/auth'

export default function Home() {
  const { profile, offline } = useAuth()
  const name = profile?.display_name?.trim()

  return (
    <Page>
      <PageHeader title="Dawah Trainer" subtitle="Practice answering hard questions, kindly." />

      <Card className="mb-4 bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <p className="text-sm opacity-90">Assalamu alaykum{name ? `, ${name}` : ''} 👋</p>
        <h2 className="mt-1 text-xl font-bold">Ready to train?</h2>
        <p className="mt-1 text-sm leading-relaxed opacity-95">
          Learn one argument. Practice it in a debate. Get honest feedback.
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <span>
            <strong className="text-lg">{profile?.xp ?? 0}</strong> XP
          </span>
          <span>
            <strong className="text-lg">{profile?.streak_count ?? 0}</strong> day streak
          </span>
          <span>
            Level <strong className="text-lg">{profile?.level ?? 1}</strong>
          </span>
        </div>
      </Card>

      {offline && (
        <Card className="mb-4 border-amber-400 bg-amber-50 text-sm dark:bg-amber-950/30">
          <p className="font-semibold">Offline mode</p>
          <p className="muted mt-1 leading-relaxed">
            No Supabase project is connected, so your progress is not saved. Copy{' '}
            <code>.env.example</code> to <code>.env</code> and add your keys.
          </p>
        </Card>
      )}

      <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide muted">Start here</h2>
      <div className="grid gap-3">
        <LinkCard
          to="/learn"
          emoji="📚"
          title="Learning Path"
          description="Step-by-step lessons, quizzes, and flashcards. Start at Level 1."
        />
        <LinkCard
          to="/debate"
          emoji="🗣️"
          title="Practice Debate"
          description="Talk to a pretend atheist. Get a score at the end."
        />
        <LinkCard
          to="/ask"
          emoji="❓"
          title="Ask a Question"
          description="Get a simple answer with real sources."
        />
      </div>

      <Disclaimer />
    </Page>
  )
}
