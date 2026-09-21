import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page, PageHeader, Card, EmptyState, Spinner, Badge } from '../components/ui'
import { Markdown } from '../components/Markdown'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { getBySlug } from '../lib/content'
import { shortDate } from '../lib/format'
import type { Note } from '../lib/types'

export default function Notes() {
  const { user, offline } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase || !user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!cancelled) {
        setNotes((data ?? []) as Note[])
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user])

  async function remove(id: string) {
    if (!supabase) return
    await supabase.from('notes').delete().eq('id', id)
    setNotes((n) => n.filter((x) => x.id !== id))
  }

  if (loading) {
    return (
      <Page>
        <PageHeader title="My notes" back="/profile" />
        <Spinner />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader title="My notes" subtitle={`${notes.length} saved`} back="/profile" />

      {offline && (
        <Card className="mb-3 border-amber-400 bg-amber-50 text-sm dark:bg-amber-950/30">
          <p className="muted">Not connected, so notes cannot be saved or loaded.</p>
        </Card>
      )}

      {notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          body="Open any page in the Library and press 'Save a note' to write the idea in your own words. Writing it yourself is how it sticks."
        />
      ) : (
        <ul className="grid gap-2">
          {notes.map((note) => {
            const row = note.linked_slug ? getBySlug(note.linked_slug) : undefined
            return (
              <li key={note.id}>
                <Card as="article">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug">{note.title}</p>
                      <p className="muted text-xs">{shortDate(note.created_at)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void remove(note.id)}
                      className="muted shrink-0 text-xs underline"
                      aria-label={`Delete note: ${note.title}`}
                    >
                      Delete
                    </button>
                  </div>
                  <Markdown text={note.body_md} className="mt-1 text-sm" />
                  {row && (
                    <Link to={`/library/${row.slug}`} className="mt-2 inline-block">
                      <Badge tone="brand">Back to the page ↗</Badge>
                    </Link>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}
