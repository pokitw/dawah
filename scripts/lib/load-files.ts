import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ResearchFiles } from './parse-research.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
export const projectRoot = path.resolve(here, '..', '..')
export const researchDir = path.join(projectRoot, 'research')

const FILES: Record<keyof ResearchFiles, string> = {
  index: '00-index.md',
  arguments: '01-arguments-for-god.md',
  objections: '02-atheist-objections.md',
  sources: '03-islamic-sources.md',
  philosophy: '04-philosophy-basics.md',
  method: '05-dawah-method.md',
  personas: '06-roleplay-personas.md',
  qa: '07-qa-bank.md',
  learning: '08-learning-path.md',
  features: '09-feature-spec.md',
}

export function loadResearchFiles(dir = researchDir): ResearchFiles {
  const out = {} as ResearchFiles
  for (const [key, name] of Object.entries(FILES) as [keyof ResearchFiles, string][]) {
    const full = path.join(dir, name)
    if (!fs.existsSync(full)) {
      throw new Error(`Missing research file: ${full}`)
    }
    out[key] = fs.readFileSync(full, 'utf8')
  }
  return out
}
