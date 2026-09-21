/**
 * Loads /research into Supabase.
 *
 * Run:  npm run seed          (writes to the database)
 *       npm run seed:dry      (shows what it would write, writes nothing)
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.
 * The service_role key is a SERVER key. Never put it in the frontend.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { loadResearchFiles, projectRoot } from './lib/load-files.ts'
import { parseResearch } from './lib/parse-research.ts'

// --- tiny .env reader, so no extra dependency is needed --------------------
function loadEnv() {
  const file = path.join(projectRoot, '.env')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (!m) continue
    const value = m[2].replace(/^["']|["']$/g, '')
    if (!process.env[m[1]]) process.env[m[1]] = value
  }
}

const dryRun = process.argv.includes('--dry-run')

async function main() {
  loadEnv()

  const parsed = parseResearch(loadResearchFiles())
  const kinds = parsed.content.reduce<Record<string, number>>((acc, r) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + 1
    return acc
  }, {})

  console.log('Parsed /research:')
  console.table(kinds)
  console.log(`flashcards: ${parsed.flashcards.length}`)

  if (dryRun) {
    console.log('\nDry run — nothing was written.')
    console.log('First 3 slugs:', parsed.content.slice(0, 3).map((r) => r.slug).join(', '))
    return
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error(
      '\nMissing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Copy .env.example to .env and fill them in, then run again.\n' +
        'To see the parsed rows without a database, run: npm run seed:dry',
    )
    process.exit(1)
  }

  const db = createClient(url, key, { auth: { persistSession: false } })

  // research_content -------------------------------------------------------
  const contentRows = parsed.content.map((r) => ({
    kind: r.kind,
    slug: r.slug,
    title: r.title,
    tags: r.tags,
    body_md: r.body_md,
    difficulty: r.difficulty,
    meta: r.meta,
    updated_at: new Date().toISOString(),
  }))

  for (let i = 0; i < contentRows.length; i += 100) {
    const batch = contentRows.slice(i, i + 100)
    const { error } = await db.from('research_content').upsert(batch, { onConflict: 'slug' })
    if (error) throw new Error(`research_content: ${error.message}`)
    console.log(`  research_content ${i + batch.length}/${contentRows.length}`)
  }

  // flashcards -------------------------------------------------------------
  for (let i = 0; i < parsed.flashcards.length; i += 100) {
    const batch = parsed.flashcards.slice(i, i + 100)
    const { error } = await db.from('flashcards').upsert(batch, { onConflict: 'slug' })
    if (error) throw new Error(`flashcards: ${error.message}`)
    console.log(`  flashcards ${i + batch.length}/${parsed.flashcards.length}`)
  }

  // Remove rows that are no longer in /research, so the database always
  // matches the files exactly.
  const liveSlugs = new Set(parsed.content.map((r) => r.slug))
  const { data: existing } = await db.from('research_content').select('slug')
  const stale = (existing ?? []).map((r) => r.slug).filter((s: string) => !liveSlugs.has(s))
  if (stale.length) {
    const { error } = await db.from('research_content').delete().in('slug', stale)
    if (error) throw new Error(`cleanup: ${error.message}`)
    console.log(`  removed ${stale.length} old rows`)
  }

  console.log('\nSeed finished.')
}

main().catch((err: unknown) => {
  console.error('\nSeed failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
