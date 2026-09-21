import { Page, PageHeader, LinkCard } from '../components/ui'
import { fallacyQuestions, ANSWER_PAIRS, steelmanTasks, rapidCards } from '../lib/trainers'

export default function Trainers() {
  return (
    <Page>
      <PageHeader title="Trainers" subtitle="Short drills that build one skill each" back="/learn" />
      <div className="grid gap-3">
        <LinkCard
          to="/train/fallacy"
          emoji="🕵️"
          title="Fallacy Trainer"
          description="Read a line and name the mistake in the reasoning."
          badge={`${fallacyQuestions().length} lines`}
        />
        <LinkCard
          to="/train/weak-answer"
          emoji="⚖️"
          title="Spot the Weak Answer"
          description="Two answers, one stronger. Learn what over-claiming looks like."
          badge={`${ANSWER_PAIRS.length} pairs`}
        />
        <LinkCard
          to="/train/steelman"
          emoji="🛡️"
          title="Steelman Trainer"
          description="Say the other side fairly and strongly BEFORE you answer it."
          badge={`${steelmanTasks().length} objections`}
        />
        <LinkCard
          to="/train/rapid"
          emoji="⚡"
          title="Rapid-Fire"
          description="Short answers against the clock. Builds quick recall."
          badge={`${rapidCards().length} questions`}
        />
      </div>
    </Page>
  )
}
