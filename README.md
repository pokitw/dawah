# Dawah Trainer

A training website for a young Muslim learning to answer atheist and
philosophy questions about Islam — kindly, clearly, and honestly.

Practice a debate against a pretend atheist, ask questions and get answers
with real sources, work through a step-by-step course, and see honestly what
you need to study next.

---

## The one rule that shapes everything

**The AI may only use the files in `/research`.**

It is never allowed to invent a Quran verse, a hadith number, or a fatwa
number. This is enforced in three places, not just asked for in a prompt:

1. **The prompt** tells it to use only the given sources and to say
   "I'm not fully sure, please check with a scholar" otherwise.
2. **The code** throws away any source the AI names that was not in the text
   it was actually shown, and swaps the AI's link for the one the database
   really holds. (`supabase/functions/_shared/citations.ts`)
3. **A test** feeds the checker invented citations and fails if any survive.
   (`tests/citations.test.ts`)

If a number appears in an answer that is not in the research files, the app
shows a warning above it telling you to check with a scholar.

---

## Quick start

```bash
# 1. Install
npm install

# 2. Build the study content from /research
npm run build:content

# 3. Run it
npm run dev
```

The app works straight away with no database — it reads the study material
from the bundle built in step 2. To save progress and use the AI, connect
Supabase below.

---

## Connecting Supabase and the AI

```bash
cp .env.example .env     # then fill it in
```

`.env` has three parts:

| Variable | Where it is used | Safe in the browser? |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | frontend | yes |
| `VITE_SUPABASE_ANON_KEY` | frontend | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | seed script only | **no — server only** |
| `ANTHROPIC_API_KEY` | edge functions only | **no — server only** |

Then:

```bash
supabase link --project-ref <your-project-ref>
supabase db push                                  # creates the tables
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... # server-side only
supabase functions deploy ask-qa
supabase functions deploy debate-turn
supabase functions deploy coach-hint
supabase functions deploy score-debate
npm run seed                                      # loads /research
```

**The Anthropic key never goes in the browser.** It is read in exactly one
file (`supabase/functions/_shared/anthropic.ts`), which runs on Supabase's
servers. `tests/no-secrets-in-bundle.test.ts` builds the real app and fails
if a key, or the code that reads one, ever ends up in what ships to a phone.

### Changing the AI model

One line: `MODEL` in `supabase/functions/_shared/config.ts`. It is set to
`claude-opus-5`. For something cheaper, change it to `claude-sonnet-5` and
redeploy the four functions.

---

## What is in the app

| Tab | What it does |
| --- | --- |
| **Home** | Your XP, streak and level, and where to start. |
| **Learn** | 4 levels, 12 modules, 41 quiz questions, 110 flashcards, 4 trainers, a daily challenge. |
| **Debate** | Pick one of 12 personas, a difficulty, a topic, and which side you play. Coach hints on the side. A scorecard at the end. |
| **Ask** | Ask anything. Get a simple answer with its sources, and an "Explain simpler" button. |
| **Profile** | Progress, study-next list, debate history, saved notes. |

### The trainers

- **Fallacy Trainer** — read a line, name the mistake.
- **Spot the Weak Answer** — two answers, pick the stronger, see why.
- **Steelman Trainer** — write the objection fairly *before* answering it.
- **Rapid-Fire** — short answers on a 30-second clock.

### The scorecard

Marked on the six things from `06-roleplay-personas.md`, 0–5 each:
logic, accuracy of Islamic sources, understanding the opponent, clarity,
adab, and avoiding overclaim. The AI judges the six parts; the app does all
the arithmetic, so the total always matches the bars and a wrong number from
the AI cannot corrupt your progress.

---

## How the research becomes the app

```
/research/*.md
     │
     │  npm run build:content   (scripts/build-content.ts)
     ▼
src/data/research.json ──────────► the app reads this (fast, works offline)
     │
     │  npm run seed            (scripts/seed.ts)
     ▼
Supabase research_content ───────► the edge functions read this (server side)
```

Both copies come from the same parser, so they cannot drift. Nothing is
copied by hand. `docs/knowledge-map.md` lists every id (`ARG-1`…`ARG-7`,
`OBJ-1`…`OBJ-17`, `P1`…`P12`, `QA-1`…`QA-62`) and every citation the AI is
allowed to use.

If you edit a file in `/research`, run `npm run build:content` and
`npm run seed` again.

---

## Safety

If someone writes something that sounds like real distress rather than
practice — "I'm losing my faith", "I want to die" — the app stops the
exercise and answers warmly instead: doubts are normal, talk to people you
trust and to a scholar, gentle steps, and where to get urgent help.

This check runs **before** the AI is called, and it runs in the browser as
well as on the server, so it still works if the network or the AI is down.
It never shames anyone and never says they "just want to sin".

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run it locally |
| `npm run build` | Type-check and build for production |
| `npm run build:content` | Rebuild `src/data/research.json` from `/research` |
| `npm run seed` | Load `/research` into Supabase |
| `npm run seed:dry` | Show what the seed would write, without writing |
| `npm test` | Run all the tests |

## Tests

166 tests, all offline — none of them call the AI or cost money.

| File | What it protects |
| --- | --- |
| `tests/srs.test.ts` | The 1/3/7/16/35-day flashcard ladder, resets, leap years, timezone drift |
| `tests/scoring.test.ts` | Scorecard maths, bands, XP, and that the browser and server copies agree |
| `tests/citations.test.ts` | That an invented citation can never reach the page |
| `tests/safety.test.ts` | Faith-crisis detection, the wording of the reply, browser/server parity |
| `tests/no-secrets-in-bundle.test.ts` | That no API key is in the built app |
| `tests/markdown.test.ts` | That AI text cannot inject scripts or bad links |

---

## Built with

React 19 · TypeScript · Vite · Tailwind CSS v4 · Supabase (Postgres, Auth,
Edge Functions) · Claude.

Mobile-first, dark and light mode, works at 320px wide, and readable with a
screen reader.

---

> **This is a study tool, not a fatwa.** For real rulings, ask a qualified
> scholar.
