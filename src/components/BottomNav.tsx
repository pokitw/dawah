import { NavLink } from 'react-router-dom'
import { AskIcon, DebateIcon, HomeIcon, LearnIcon, ProfileIcon } from './Icons'

const items = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/learn', label: 'Learn', Icon: LearnIcon, end: false },
  { to: '/debate', label: 'Debate', Icon: DebateIcon, end: false },
  { to: '/ask', label: 'Ask', Icon: AskIcon, end: false },
  { to: '/profile', label: 'Profile', Icon: ProfileIcon, end: false },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--line)] bg-[color:var(--card)]/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-2xl">
        {items.map(({ to, label, Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 py-2 text-[0.6875rem] font-semibold',
                  isActive
                    ? 'text-brand-700 dark:text-brand-300'
                    : 'text-[color:var(--muted)]',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-6 w-6" />
                  <span>{label}</span>
                  <span className="sr-only">{isActive ? '(current page)' : ''}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
