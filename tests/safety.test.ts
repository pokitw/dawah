/**
 * Faith-crisis handling.
 *
 * The brief requires the app to pause and be gentle when someone is in real
 * distress rather than practising. The AI is told this in every prompt, but
 * a real cry for help must not depend on the model noticing, so a plain
 * check runs first — on the server AND in the browser.
 */
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { CRISIS_REPLY, checkSafetyLocal } from '../src/lib/safety'
import { checkSafety } from '../supabase/functions/_shared/safety.ts'

const DISTRESS = [
  "I can't believe anymore and I'm scared",
  'I am losing my faith',
  "I'm losing my faith and I don't know what to do",
  'my iman is gone',
  'I want to leave Islam',
  "I'm scared of losing my faith",
  'I feel so empty about my faith',
  "I'm having a faith crisis",
  'these doubts are killing me',
  "I can't pray anymore",
  "I'm becoming an atheist",
]

const PRACTICE = [
  'Who created God?',
  'If God is good, why is there evil?',
  'How do I answer someone who says I only believe because I was born Muslim?',
  'What is the kalam argument?',
  'My friend says science explains everything. What do I say?',
  'Someone told me the Quran has contradictions',
  'Explain the fitrah to me',
  'What is the strongest atheist objection to God?',
  'Why do babies suffer?',
  'Is it wrong to have doubts?',
]

describe('it notices real distress', () => {
  for (const text of DISTRESS) {
    it(`pauses for: "${text}"`, () => {
      expect(checkSafetyLocal(text).crisis).toBe(true)
      expect(checkSafety(text).crisis).toBe(true)
    })
  }
})

describe('it does NOT interrupt normal practice', () => {
  for (const text of PRACTICE) {
    it(`carries on for: "${text}"`, () => {
      expect(checkSafetyLocal(text).crisis).toBe(false)
      expect(checkSafety(text).crisis).toBe(false)
    })
  }
})

describe('practice markers cancel a false alarm', () => {
  it('lets a roleplay line through even if it sounds heavy', () => {
    const line = 'For practice, pretend I said: I am losing my faith'
    expect(checkSafetyLocal(line).crisis).toBe(false)
  })

  it('lets "how do I answer" through', () => {
    const line = "How do I answer someone who says I want to leave Islam?"
    expect(checkSafetyLocal(line).crisis).toBe(false)
  })
})

describe('the reply itself', () => {
  const reply = checkSafetyLocal('I am losing my faith').reply

  it('is returned when there is a crisis', () => {
    expect(reply).toBe(CRISIS_REPLY)
    expect(reply.length).toBeGreaterThan(200)
  })

  it('is empty when there is not', () => {
    expect(checkSafetyLocal('Who created God?').reply).toBe('')
  })

  it('never shames the person', () => {
    expect(reply.toLowerCase()).not.toMatch(/just want to sin/)
    expect(reply.toLowerCase()).not.toMatch(/\bsinner\b|\bshame\b|your fault/)
  })

  it('does not argue back', () => {
    expect(reply.toLowerCase()).not.toMatch(/you are wrong|let me prove|actually, the evidence/)
  })

  it('says doubts are normal', () => {
    expect(reply.toLowerCase()).toMatch(/doubts are normal/)
  })

  it('points to trusted people and to scholars', () => {
    expect(reply.toLowerCase()).toMatch(/trust/)
    expect(reply.toLowerCase()).toMatch(/scholar/)
  })

  it('suggests gentle steps', () => {
    expect(reply.toLowerCase()).toMatch(/dua/)
    expect(reply.toLowerCase()).toMatch(/good company|friend/)
  })

  it('handles the self-harm case by pointing at real help', () => {
    const urgent = checkSafetyLocal('I want to die').reply
    expect(urgent.toLowerCase()).toMatch(/emergency|crisis line|reach out/)
  })

  it('only cites sources that are in the research files', () => {
    // The reply quotes the waswas hadith; those numbers must be the real ones.
    expect(reply).toMatch(/Sahih al-Bukhari 3276/)
    expect(reply).toMatch(/Sahih Muslim 134/)
    // And it must not merge in the separate "Amantu billah" narration.
    const merged = /Bukhari 3276[^.]*Amantu billah/.test(reply)
    expect(merged).toBe(false)
  })
})

describe('it copes with odd input', () => {
  it('handles empty and whitespace', () => {
    expect(checkSafetyLocal('').crisis).toBe(false)
    expect(checkSafetyLocal('   ').crisis).toBe(false)
  })

  it('handles a very long message without hanging', () => {
    const long = 'why is there evil? '.repeat(5000)
    const started = Date.now()
    expect(checkSafetyLocal(long).crisis).toBe(false)
    expect(Date.now() - started).toBeLessThan(1000)
  })

  it('still catches distress inside a longer message', () => {
    const text =
      'I have been reading a lot about the problem of evil lately and honestly ' +
      "I am losing my faith and I do not know who to talk to about it."
    expect(checkSafetyLocal(text).crisis).toBe(true)
  })
})

describe('the browser and server copies match', () => {
  const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
  const client = read('src/lib/safety.ts')
  const server = read('supabase/functions/_shared/safety.ts')

  const listOf = (src: string, name: string) => {
    const start = src.indexOf(`const ${name}: RegExp[] = [`)
    expect(start, `${name} missing`).toBeGreaterThan(-1)
    const rest = src.slice(start)
    return rest.slice(0, rest.indexOf(']')).replace(/\s+/g, ' ')
  }

  it('use identical crisis patterns', () => {
    expect(listOf(server, 'CRISIS_PATTERNS')).toBe(listOf(client, 'CRISIS_PATTERNS'))
  })

  it('use identical practice markers', () => {
    expect(listOf(server, 'PRACTICE_MARKERS')).toBe(listOf(client, 'PRACTICE_MARKERS'))
  })

  it('use the identical reply text', () => {
    const replyOf = (src: string) => {
      const start = src.indexOf('CRISIS_REPLY = `')
      return src.slice(start, src.indexOf('`', start + 16))
    }
    expect(replyOf(server)).toBe(replyOf(client))
  })

  it('agree on every test phrase above', () => {
    for (const text of [...DISTRESS, ...PRACTICE]) {
      expect(checkSafety(text).crisis, text).toBe(checkSafetyLocal(text).crisis)
    }
  })
})

describe('every AI mode is told the safety rule', () => {
  const prompts = fs.readFileSync(
    path.join(process.cwd(), 'supabase/functions/_shared/prompts.ts'),
    'utf8',
  )

  /**
   * The whole body of one exported function: from its `export function` line
   * up to the next top-level `export`, or the end of the file.
   */
  const bodyOf = (name: string): string => {
    const start = prompts.indexOf(`export function ${name}`)
    expect(start, `${name} not found`).toBeGreaterThan(-1)
    const rest = prompts.slice(start + 1)
    const next = rest.indexOf('\nexport ')
    return next === -1 ? rest : rest.slice(0, next)
  }

  it('the safety prompt is the one from the brief', () => {
    expect(prompts).toMatch(/gently pause the exercise/)
    expect(prompts).toMatch(/Never say they 'just want to sin\.'/)
  })

  it('Ask mode includes it', () => {
    expect(bodyOf('askSystemPrompt')).toMatch(/SAFETY_PROMPT/)
  })

  it('Debate mode includes it, and it is allowed to break character', () => {
    const body = bodyOf('debateSystemPrompt')
    expect(body).toMatch(/SAFETY_PROMPT/)
    expect(body).toMatch(/break character/)
  })

  it('every mode is told never to invent a citation', () => {
    for (const name of [
      'askSystemPrompt',
      'debateSystemPrompt',
      'coachSystemPrompt',
      'scoreSystemPrompt',
    ]) {
      expect(bodyOf(name), name).toMatch(/CITATION_RULES/)
    }
  })

  it('the four prompts from the brief are present word for word', () => {
    expect(prompts).toMatch(/You are a kind Islamic dawah study helper/)
    expect(prompts).toMatch(/You are role-playing as \{persona_name\}/)
    expect(prompts).toMatch(/You are a quiet coach for the user during a live debate/)
    expect(prompts).toMatch(/Score the USER's messages in this debate using this rubric/)
  })
})
