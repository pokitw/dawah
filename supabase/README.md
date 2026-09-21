# Supabase setup

## What is in here

| Path | What it does |
| --- | --- |
| `migrations/20260101000000_init.sql` | All 11 tables, the enums, and Row Level Security. |
| `migrations/20260101000100_functions.sql` | Search + XP/streak + weakness-average helpers. |
| `migrations/20260101000200_tighten_grants.sql` | Removes the default "anyone can execute" permission. |
| `functions/` | Edge functions. These are the ONLY place the Anthropic key is used. |

## First-time setup

```bash
# 1. Link this folder to your project
supabase link --project-ref <your-project-ref>

# 2. Push the schema
supabase db push

# 3. Put your Anthropic key on the server (never in the browser)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# 4. Deploy the edge functions
supabase functions deploy ask-qa
supabase functions deploy debate-turn
supabase functions deploy coach-hint
supabase functions deploy score-debate

# 5. Load /research into the database
npm run seed
```

## Row Level Security in one line

`research_content` and `flashcards` are shared study material: any signed-in
user can READ them and nobody can write them from the browser. Every other
table holds one person's own work, so a user can only see and change their own
rows.

## A note on the security advisor

Supabase's linter flags `record_activity`, `record_weakness`, `set_user_level`
and `search_research` as `SECURITY DEFINER` functions that signed-in users can
call. That is on purpose: they have to run with raised rights to do the maths
in one place, and each one checks `auth.uid()` before touching anything, so a
user can still only change their own rows.
