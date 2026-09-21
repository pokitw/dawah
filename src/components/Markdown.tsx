import { Fragment, type ReactNode } from 'react'

/**
 * A very small Markdown renderer.
 *
 * It builds React elements instead of raw HTML, so text from the AI or the
 * database can never inject scripts into the page.
 *
 * Supported: # headings, - and 1. lists, > quotes, **bold**, *italic*,
 * `code`, [link](url), --- rules, and blank-line paragraphs.
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g

function safeHref(raw: string): string | null {
  const url = raw.trim()
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/') || url.startsWith('#')) return url
  return null // block javascript:, data:, and anything else
}

function renderInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  const parts = text.split(INLINE)

  parts.forEach((part, i) => {
    if (!part) return
    const key = `${keyBase}-${i}`

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      out.push(<strong key={key}>{part.slice(2, -2)}</strong>)
      return
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      out.push(
        <code
          key={key}
          className="rounded bg-black/5 px-1 py-0.5 font-mono text-[0.85em] dark:bg-white/10"
        >
          {part.slice(1, -1)}
        </code>,
      )
      return
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
    if (link) {
      const href = safeHref(link[2])
      if (href) {
        out.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-700 underline underline-offset-2 dark:text-brand-300"
          >
            {link[1]}
          </a>,
        )
      } else {
        out.push(<Fragment key={key}>{link[1]}</Fragment>)
      }
      return
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      out.push(<em key={key}>{part.slice(1, -1)}</em>)
      return
    }
    out.push(<Fragment key={key}>{part}</Fragment>)
  })

  return out
}

export function Markdown({ text, className = '' }: { text: string; className?: string }) {
  const lines = (text ?? '').replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i++
      continue
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={key++} className="my-4 border-[color:var(--line)]" />)
      i++
      continue
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line)
    if (heading) {
      const level = heading[1].length
      const size = ['text-xl', 'text-lg', 'text-base', 'text-sm'][level - 1]
      const Tag = (['h2', 'h3', 'h4', 'h5'] as const)[level - 1]
      blocks.push(
        <Tag key={key++} className={`${size} mt-4 mb-2 font-bold first:mt-0`}>
          {renderInline(heading[2], `h${key}`)}
        </Tag>,
      )
      i++
      continue
    }

    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      blocks.push(
        <blockquote
          key={key++}
          className="my-3 border-l-4 border-brand-400 pl-3 text-[0.95em] italic"
        >
          {renderInline(quote.join(' '), `q${key}`)}
        </blockquote>,
      )
      continue
    }

    if (/^\s*([-*+])\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line)
      const items: string[] = []
      while (
        i < lines.length &&
        (ordered ? /^\s*\d+[.)]\s+/.test(lines[i]) : /^\s*([-*+])\s+/.test(lines[i]))
      ) {
        items.push(lines[i].replace(/^\s*(?:[-*+]|\d+[.)])\s+/, ''))
        i++
      }
      const List = ordered ? 'ol' : 'ul'
      blocks.push(
        <List
          key={key++}
          className={`my-2 space-y-1 pl-5 ${ordered ? 'list-decimal' : 'list-disc'}`}
        >
          {items.map((item, n) => (
            <li key={n}>{renderInline(item, `li${key}-${n}`)}</li>
          ))}
        </List>,
      )
      continue
    }

    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4})\s/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*([-*+])\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim())
    ) {
      para.push(lines[i])
      i++
    }
    blocks.push(
      <p key={key++} className="my-2 leading-relaxed">
        {renderInline(para.join(' '), `p${key}`)}
      </p>,
    )
  }

  return <div className={className}>{blocks}</div>
}
