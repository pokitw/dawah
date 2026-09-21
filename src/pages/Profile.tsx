import { useEffect, useState } from 'react'
import { Page, PageHeader, Card, LinkCard, Badge, ThemeToggle } from '../components/ui'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { levels } from '../lib/content'
import { loadQuizHistory, passedModules } from '../lib/progress'
import { shortDate } from '../lib/format'

export default function Profile() {
  const { user, profile, offline, signInWithEmail, signOut, refreshProfile } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailState, setEmailState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [emailError, setEmailError] = useState('')
  const [passedCount, setPassedCount] = useState(0)

  const totalModules = levels.reduce((n, l) => n + l.modules.length, 0)
  const isAnonymous = Boolean(user?.is_anonymous)

  useEffect(() => {
    setName(profile?.display_name ?? '')
  }, [profile?.display_name])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) return
      const history = await loadQuizHistory(user.id)
      if (!cancelled) setPassedCount(passedModules(history).size)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user])

  async function saveName() {
    if (!supabase || !user) return
    await supabase.from('profiles').update({ display_name: name.trim() || null }).eq('id', user.id)
    void refreshProfile()
  }

  async function setLevel(level: number) {
    if (!supabase) return
    await supabase.rpc('set_user_level', { p_level: level })
    void refreshProfile()
  }

  async function sendLink() {
    setEmailState('sending')
    setEmailError('')
    const { error } = await signInWithEmail(email.trim())
    if (error) {
      setEmailState('error')
      setEmailError(error)
    } else {
      setEmailState('sent')
    }
  }

  return (
    <Page>
      <PageHeader title="Profile" subtitle="Your progress" right={<ThemeToggle />} />

      <Card className="mb-4 bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-2xl font-bold tabular-nums">{profile?.xp ?? 0}</p>
            <p className="text-xs opacity-90">XP</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{profile?.streak_count ?? 0}</p>
            <p className="text-xs opacity-90">day streak</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">
              {passedCount}/{totalModules}
            </p>
            <p className="text-xs opacity-90">modules</p>
          </div>
        </div>
        {profile?.last_active_date && (
          <p className="mt-3 text-center text-xs opacity-80">
            Last studied {shortDate(profile.last_active_date)}
          </p>
        )}
      </Card>

      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide muted">Your stuff</h2>
      <div className="grid gap-3">
        <LinkCard
          to="/weakness"
          emoji="🎯"
          title="Study next"
          description="What to work on, based on your real scorecards."
        />
        <LinkCard
          to="/history"
          emoji="📜"
          title="Debate history"
          description="Read any old debate again, with its scorecard."
        />
        <LinkCard
          to="/notes"
          emoji="📝"
          title="My notes"
          description="Everything you wrote in your own words."
        />
        <LinkCard
          to="/library"
          emoji="📖"
          title="Library"
          description="Arguments, objections, Q&A, glossary and sources."
        />
      </div>

      {!offline && (
        <>
          <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide muted">Settings</h2>

          <Card className="mb-3">
            <label htmlFor="display-name" className="block text-sm font-semibold">
              What should we call you?
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="display-name"
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                placeholder="Your name"
              />
              <button type="button" className="btn btn-ghost" onClick={() => void saveName()}>
                Save
              </button>
            </div>
          </Card>

          <Card className="mb-3">
            <p className="text-sm font-semibold">Your level</p>
            <p className="muted mt-0.5 text-xs">
              This unlocks levels in the course. Move up when you feel ready.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {levels.map((l) => (
                <button
                  key={l.level}
                  type="button"
                  onClick={() => void setLevel(l.level)}
                  aria-pressed={profile?.level === l.level}
                  className={`chip ${
                    profile?.level === l.level
                      ? 'border-brand-500 bg-brand-600 text-white'
                      : 'hover:border-brand-400'
                  }`}
                >
                  Level {l.level}
                </button>
              ))}
            </div>
          </Card>

          {isAnonymous && (
            <Card className="mb-3">
              <p className="text-sm font-semibold">Keep your progress safe</p>
              <p className="muted mt-0.5 text-xs leading-relaxed">
                Right now your progress lives only on this device. Add your email and we will
                send you a link, so you can use the same account on your phone and laptop.
              </p>
              {emailState === 'sent' ? (
                <p className="mt-2 rounded-lg border border-emerald-400 bg-emerald-50 p-2 text-sm dark:bg-emerald-950/40">
                  ✅ Check your email for the link.
                </p>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    type="email"
                    className="field"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Your email"
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => void sendLink()}
                    disabled={emailState === 'sending' || !email.includes('@')}
                  >
                    {emailState === 'sending' ? 'Sending…' : 'Send'}
                  </button>
                </div>
              )}
              {emailError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{emailError}</p>
              )}
            </Card>
          )}

          {!isAnonymous && user?.email && (
            <Card className="mb-3">
              <p className="text-sm">
                Signed in as <strong>{user.email}</strong>
              </p>
              <button
                type="button"
                className="btn btn-ghost mt-2 !min-h-0 !py-2 text-sm"
                onClick={() => void signOut()}
              >
                Sign out
              </button>
            </Card>
          )}
        </>
      )}

      {offline && (
        <Card className="mt-6 border-amber-400 bg-amber-50 text-sm dark:bg-amber-950/30">
          <p className="font-semibold">Offline mode</p>
          <p className="muted mt-1 leading-relaxed">
            No Supabase project is connected, so nothing is saved. You can still read
            everything in the Library and use the trainers.
          </p>
        </Card>
      )}

      <Card className="mt-6">
        <p className="muted text-xs leading-relaxed">
          <Badge>About</Badge> All the study material in this app comes from the{' '}
          <code>/research</code> files. The AI may only use those, and any source it invents is
          removed before you see it. This is a study tool, not a fatwa — for real rulings, ask
          a qualified scholar.
        </p>
      </Card>
    </Page>
  )
}
