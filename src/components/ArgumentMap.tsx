import type { ContentRow } from '../lib/content'

/**
 * Draws an argument as a tree: premises flow down into the conclusion, and
 * the strongest objection hangs off the side with the reply under it.
 *
 * Built from divs rather than SVG so it reflows on a narrow phone screen and
 * stays readable to a screen reader.
 */
export function ArgumentMap({ row }: { row: ContentRow }) {
  const meta = row.meta as {
    premises?: string[]
    conclusion?: string
    objection?: string
    reply?: string
    avoid?: string
  }

  const premises = meta.premises ?? []
  const conclusion = meta.conclusion ?? ''

  if (!premises.length && !conclusion) return null

  return (
    <figure className="my-4">
      <figcaption className="muted mb-2 text-xs font-semibold uppercase tracking-wide">
        The argument as a map
      </figcaption>

      <div className="card overflow-hidden p-0">
        {premises.length > 0 && (
          <div className="p-3">
            <p className="muted mb-2 text-xs font-semibold">
              Reasons (premises) — the steps you start from
            </p>
            <ol className="grid gap-2">
              {premises.map((p, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-brand-300 bg-brand-50 p-2 text-sm dark:border-brand-800 dark:bg-brand-950/40"
                >
                  {p}
                </li>
              ))}
            </ol>
          </div>
        )}

        {conclusion && (
          <>
            <div className="flex justify-center" aria-hidden="true">
              <span className="text-xl leading-none text-brand-500">↓</span>
            </div>
            <div className="p-3 pt-1">
              <p className="muted mb-2 text-xs font-semibold">
                Conclusion — the point they lead to
              </p>
              <p className="rounded-lg border-2 border-brand-500 bg-brand-100 p-3 text-sm font-semibold dark:bg-brand-900/60">
                {conclusion}
              </p>
            </div>
          </>
        )}

        {meta.objection && (
          <div className="border-t border-[color:var(--line)] p-3">
            <p className="muted mb-2 text-xs font-semibold">
              ⟵ Branch: the strongest thing an atheist says back
            </p>
            <p className="rounded-lg border border-red-300 bg-red-50 p-2 text-sm dark:border-red-900 dark:bg-red-950/40">
              {meta.objection}
            </p>

            {meta.reply && (
              <>
                <div className="flex justify-center py-1" aria-hidden="true">
                  <span className="text-xl leading-none text-emerald-500">↓</span>
                </div>
                <p className="muted mb-2 text-xs font-semibold">The best reply</p>
                <p className="rounded-lg border border-emerald-400 bg-emerald-50 p-2 text-sm dark:border-emerald-800 dark:bg-emerald-950/40">
                  {meta.reply}
                </p>
              </>
            )}
          </div>
        )}

        {meta.avoid && (
          <div className="border-t border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
            <p className="font-semibold">⚠️ Weak version — do NOT say this</p>
            <p className="mt-1">{meta.avoid}</p>
          </div>
        )}
      </div>
    </figure>
  )
}
