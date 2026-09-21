/**
 * One place to change the AI model.
 *
 * Checked against the current Anthropic docs at build time (2026-09).
 * `claude-opus-5` is the current strong model. To use a cheaper one, change
 * this single line to `claude-sonnet-5` and redeploy the functions.
 *
 * On this model family:
 *   - Thinking is ON by default, so we do not send a `thinking` field.
 *   - `budget_tokens` is REMOVED and returns a 400 if sent.
 *   - Assistant "prefill" is removed; use output_config.format for JSON.
 *   - Depth is controlled with `output_config.effort`.
 */
export const MODEL = 'claude-opus-5'

/** How hard the model should think, per job. */
export const EFFORT = {
  /** Debate replies must feel like a real, fast conversation. */
  debate: 'medium',
  /** A one-line tip. Keep it quick and cheap. */
  coach: 'low',
  /** Answers must be accurate about sources, so think harder. */
  qa: 'high',
  /** Marking someone's work honestly is the highest-stakes job here. */
  score: 'high',
} as const

/** Output budget per job. Thinking tokens count towards this, so be generous. */
export const MAX_TOKENS = {
  debate: 8000,
  coach: 4000,
  qa: 16000,
  score: 16000,
} as const

/** How many research rows to put in front of the model. */
export const RETRIEVAL_LIMIT = 10
