import { Link, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { BackIcon, MoonIcon, SunIcon } from './Icons'
import { useTheme } from '../lib/theme'

/** The line that must sit under every AI answer. */
export const DISCLAIMER =
  'This is a study tool, not a fatwa. For real rulings, ask a qualified scholar.'

export function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`muted mt-3 text-xs leading-relaxed ${className}`}>
      <span aria-hidden="true">⚠️ </span>
      {DISCLAIMER}
    </p>
  )
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="btn btn-ghost !min-h-0 !px-2.5 !py-2"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

export function PageHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: string
  subtitle?: string
  back?: string | true
  right?: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-4 border-b border-[color:var(--line)] bg-[color:var(--page)]/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        {back && (
          <button
            type="button"
            onClick={() => (back === true ? navigate(-1) : navigate(back))}
            aria-label="Go back"
            className="btn btn-ghost !min-h-0 !px-2 !py-2"
          >
            <BackIcon />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{title}</h1>
          {subtitle && <p className="muted truncate text-xs">{subtitle}</p>}
        </div>
        {right ?? <ThemeToggle />}
      </div>
    </header>
  )
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl px-4 pb-8">{children}</div>
}

export function Card({
  children,
  className = '',
  as = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'li' | 'article'
}) {
  const Tag = as
  return <Tag className={`card p-4 ${className}`}>{children}</Tag>
}

export function LinkCard({
  to,
  title,
  description,
  badge,
  emoji,
}: {
  to: string
  title: string
  description: string
  badge?: string
  emoji?: string
}) {
  return (
    <Link
      to={to}
      className="card flex items-start gap-3 p-4 transition-colors hover:border-brand-400"
    >
      {emoji && (
        <span aria-hidden="true" className="text-2xl leading-none">
          {emoji}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-semibold">{title}</span>
          {badge && <span className="chip border-brand-400 text-brand-700 dark:text-brand-300">{badge}</span>}
        </span>
        <span className="muted mt-0.5 block text-sm leading-relaxed">{description}</span>
      </span>
    </Link>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 py-6 text-sm muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      {label}…
    </div>
  )
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="card border-red-400 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200"
    >
      {message}
    </div>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'brand'
}) {
  const tones = {
    neutral: 'border-[color:var(--line)] muted',
    good: 'border-emerald-400 text-emerald-700 dark:text-emerald-300',
    warn: 'border-amber-400 text-amber-700 dark:text-amber-300',
    bad: 'border-red-400 text-red-700 dark:text-red-300',
    brand: 'border-brand-400 text-brand-700 dark:text-brand-300',
  }
  return <span className={`chip ${tones[tone]}`}>{children}</span>
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="text-center">
      <p className="font-semibold">{title}</p>
      <p className="muted mt-1 text-sm leading-relaxed">{body}</p>
    </Card>
  )
}
