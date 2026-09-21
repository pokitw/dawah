/**
 * The Anthropic key must never reach the browser.
 *
 * These tests read the real production build and the real source tree. They
 * fail if a secret, or the code that reads one, has leaked into anything
 * that gets shipped to a user's device.
 */
import { describe, expect, it, beforeAll } from 'vitest'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const dist = path.join(root, 'dist')

function allFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? allFiles(full) : [full]
  })
}

describe('the built app carries no server secrets', () => {
  let bundle = ''
  let files: string[] = []

  beforeAll(() => {
    // Build fresh so the test can never pass against a stale dist.
    execSync('npm run build', { cwd: root, stdio: 'pipe' })
    files = allFiles(dist)
    bundle = files
      .filter((f) => /\.(js|css|html|json|map)$/.test(f))
      .map((f) => fs.readFileSync(f, 'utf8'))
      .join('\n')
  }, 180_000)

  it('produced a build to check', () => {
    expect(files.length).toBeGreaterThan(0)
    expect(bundle.length).toBeGreaterThan(1000)
  })

  it('contains no Anthropic API key', () => {
    expect(bundle).not.toMatch(/sk-ant-/)
  })

  it('never mentions ANTHROPIC_API_KEY', () => {
    expect(bundle).not.toMatch(/ANTHROPIC_API_KEY/)
  })

  it('contains no Supabase service_role key', () => {
    // A service_role JWT carries this claim; the anon key does not.
    expect(bundle).not.toMatch(/service_role/)
    expect(bundle).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
  })

  it('does not bundle the Anthropic SDK', () => {
    expect(bundle).not.toMatch(/@anthropic-ai\/sdk/)
    expect(bundle).not.toMatch(/api\.anthropic\.com/)
  })

  it('does not ship the .env file', () => {
    expect(files.some((f) => path.basename(f) === '.env')).toBe(false)
  })
})

describe('the frontend source never reaches for a server secret', () => {
  function sourceFiles(dir: string): string[] {
    return allFiles(dir).filter((f) => /\.(ts|tsx)$/.test(f))
  }

  const frontend = sourceFiles(path.join(root, 'src'))

  it('has frontend files to check', () => {
    expect(frontend.length).toBeGreaterThan(10)
  })

  it('no file under src/ reads an Anthropic key', () => {
    const guilty = frontend.filter((f) => {
      const text = fs.readFileSync(f, 'utf8')
      return /ANTHROPIC_API_KEY|sk-ant-/.test(text)
    })
    expect(guilty.map((f) => path.relative(root, f))).toEqual([])
  })

  it('no file under src/ imports the Anthropic SDK', () => {
    const guilty = frontend.filter((f) =>
      /from\s+['"]@?(npm:)?@anthropic-ai\/sdk/.test(fs.readFileSync(f, 'utf8')),
    )
    expect(guilty.map((f) => path.relative(root, f))).toEqual([])
  })

  it('no file under src/ uses the service role key', () => {
    const guilty = frontend.filter((f) =>
      /SERVICE_ROLE|service_role/.test(fs.readFileSync(f, 'utf8')),
    )
    expect(guilty.map((f) => path.relative(root, f))).toEqual([])
  })

  it('only VITE_-prefixed env vars are read in the frontend, since others are not exposed', () => {
    const bad: string[] = []
    for (const file of frontend) {
      const text = fs.readFileSync(file, 'utf8')
      for (const m of text.matchAll(/import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g)) {
        if (!m[1].startsWith('VITE_')) bad.push(`${path.relative(root, file)}: ${m[1]}`)
      }
    }
    expect(bad).toEqual([])
  })
})

describe('the Anthropic key is read in exactly one server file', () => {
  const fnDir = path.join(root, 'supabase', 'functions')
  const serverFiles = allFiles(fnDir).filter((f) => f.endsWith('.ts'))

  it('has edge function files to check', () => {
    expect(serverFiles.length).toBeGreaterThan(5)
  })

  it('only _shared/anthropic.ts reads ANTHROPIC_API_KEY', () => {
    const readers = serverFiles.filter((f) =>
      /Deno\.env\.get\(\s*['"]ANTHROPIC_API_KEY['"]\s*\)/.test(fs.readFileSync(f, 'utf8')),
    )
    expect(readers.map((f) => path.relative(fnDir, f))).toEqual([
      path.join('_shared', 'anthropic.ts'),
    ])
  })

  it('no edge function has a key hard-coded in it', () => {
    for (const file of serverFiles) {
      expect(fs.readFileSync(file, 'utf8')).not.toMatch(/sk-ant-[A-Za-z0-9]/)
    }
  })
})

describe('.env.example tells the truth about what is safe', () => {
  const example = fs.readFileSync(path.join(root, '.env.example'), 'utf8')

  it('exists and lists the three things needed', () => {
    expect(example).toMatch(/VITE_SUPABASE_URL/)
    expect(example).toMatch(/VITE_SUPABASE_ANON_KEY/)
    expect(example).toMatch(/ANTHROPIC_API_KEY/)
  })

  it('does NOT prefix the Anthropic key with VITE_, which would expose it', () => {
    expect(example).not.toMatch(/VITE_ANTHROPIC/)
  })

  it('holds no real key', () => {
    expect(example).not.toMatch(/sk-ant-[A-Za-z0-9]{20}/)
  })

  it('warns that the Anthropic key is server-side only', () => {
    expect(example.toLowerCase()).toMatch(/never put this in the frontend|server side only/)
  })
})

describe('.gitignore protects the real .env', () => {
  const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8')
  it('ignores .env', () => {
    expect(ignore.split('\n').map((l) => l.trim())).toContain('.env')
  })
})
