import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

/** Saves a short note against a library page, so you can revise it later. */
export function NoteButton({ linkedSlug, title }: { linkedSlug: string; title: string }) {
  const { user, offline } = useAuth()
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  if (offline || !user) return null

  async function save() {
    if (!supabase || !user || !body.trim()) return
    setState('saving')
    const { error } = await supabase.from('notes').insert({
      user_id: user.id,
      title: title.slice(0, 120),
      body_md: body.trim(),
      linked_slug: linkedSlug,
    })
    if (error) {
      setState('error')
      return
    }
    setState('saved')
    setBody('')
    setTimeout(() => {
      setOpen(false)
      setState('idle')
    }, 1200)
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost !min-h-0 !py-2 text-sm" onClick={() => setOpen(true)}>
        📝 Save a note
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-[color:var(--line)] p-3">
      <label htmlFor={`note-${linkedSlug}`} className="mb-1 block text-sm font-semibold">
        Your note
      </label>
      <textarea
        id={`note-${linkedSlug}`}
        className="field min-h-[4.5rem] resize-y text-sm"
        placeholder="In my own words…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="btn btn-primary !min-h-0 !py-2 text-sm"
          onClick={() => void save()}
          disabled={state === 'saving' || !body.trim()}
        >
          {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved ✓' : 'Save'}
        </button>
        <button
          type="button"
          className="btn btn-ghost !min-h-0 !py-2 text-sm"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
      {state === 'error' && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          Could not save that. Check your connection and try again.
        </p>
      )}
    </div>
  )
}
