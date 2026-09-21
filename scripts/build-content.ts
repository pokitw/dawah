/**
 * Reads /research and writes src/data/research.json.
 *
 * The app uses this bundle so it works even with no internet and no
 * Supabase project. The seed script pushes the same rows to the database.
 *
 * Run:  npm run build:content
 */
import fs from 'node:fs'
import path from 'node:path'
import { loadResearchFiles, projectRoot } from './lib/load-files.ts'
import { parseResearch } from './lib/parse-research.ts'

const parsed = parseResearch(loadResearchFiles())

const outDir = path.join(projectRoot, 'src', 'data')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(
  path.join(outDir, 'research.json'),
  JSON.stringify(parsed, null, 2) + '\n',
  'utf8',
)

const byKind = parsed.content.reduce<Record<string, number>>((acc, row) => {
  acc[row.kind] = (acc[row.kind] ?? 0) + 1
  return acc
}, {})

console.log('Wrote src/data/research.json')
console.table(byKind)
console.log(`flashcards: ${parsed.flashcards.length}`)
console.log(`quiz questions: ${parsed.quizzes.length} (${parsed.quizzes.filter((q) => q.origin === "08").length} straight from file 08)`)
console.log(`levels: ${parsed.levels.length}`)
console.log(
  `allow-list: ${parsed.allowList.quranRefs.length} verses, ` +
    `${parsed.allowList.hadith.length} hadith, ` +
    `${parsed.allowList.islamqaIds.length} islamqa ids, ` +
    `${parsed.allowList.urls.length} urls`,
)
