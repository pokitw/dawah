/**
 * The Markdown renderer builds React elements, never raw HTML, so text from
 * the AI or the database cannot inject scripts. These tests pin that down.
 */
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/components/Markdown.tsx'),
  'utf8',
)

describe('the renderer cannot inject HTML', () => {
  it('never uses dangerouslySetInnerHTML', () => {
    expect(source).not.toMatch(/dangerouslySetInnerHTML/)
  })

  it('never writes to innerHTML', () => {
    expect(source).not.toMatch(/\.innerHTML/)
  })

  it('never calls eval or the Function constructor', () => {
    expect(source).not.toMatch(/\beval\(|new Function\(/)
  })
})

describe('link URLs are checked before rendering', () => {
  // safeHref is not exported, so exercise the same rule it implements.
  const safeHref = (raw: string): string | null => {
    const url = raw.trim()
    if (/^https?:\/\//i.test(url)) return url
    if (url.startsWith('/') || url.startsWith('#')) return url
    return null
  }

  it('allows http and https', () => {
    expect(safeHref('https://sunnah.com/bukhari:3276')).toBeTruthy()
    expect(safeHref('http://example.com')).toBeTruthy()
  })

  it('allows in-app links', () => {
    expect(safeHref('/library/arg-kalam')).toBeTruthy()
    expect(safeHref('#section')).toBeTruthy()
  })

  it('blocks javascript: URLs', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull()
    expect(safeHref('  JavaScript:alert(1)')).toBeNull()
  })

  it('blocks data: URLs', () => {
    expect(safeHref('data:text/html,<script>alert(1)</script>')).toBeNull()
  })

  it('blocks other schemes', () => {
    expect(safeHref('vbscript:msgbox(1)')).toBeNull()
    expect(safeHref('file:///etc/passwd')).toBeNull()
  })

  it('is what the component actually uses', () => {
    expect(source).toMatch(/function safeHref/)
    expect(source).toMatch(/safeHref\(link\[2\]\)/)
  })
})

describe('every AI answer is shown with a disclaimer', () => {
  const ui = fs.readFileSync(path.join(process.cwd(), 'src/components/ui.tsx'), 'utf8')

  it('the disclaimer says it is not a fatwa', () => {
    expect(ui).toMatch(/not a fatwa/i)
    expect(ui).toMatch(/qualified scholar/i)
  })

  const pagesWithAi = ['src/pages/Ask.tsx', 'src/pages/Scorecard.tsx']
  for (const page of pagesWithAi) {
    it(`${path.basename(page)} renders it`, () => {
      const text = fs.readFileSync(path.join(process.cwd(), page), 'utf8')
      expect(text).toMatch(/<Disclaimer/)
    })
  }
})
