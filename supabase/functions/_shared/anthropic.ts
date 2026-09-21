/**
 * The ONLY place the Anthropic API key is read.
 *
 * This file runs on Supabase's servers, never in the browser. The key comes
 * from a secret set with:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 */
import Anthropic from 'npm:@anthropic-ai/sdk@^0.70.0'
import { MODEL } from './config.ts'

let client: Anthropic | null = null

export function anthropic(): Anthropic {
  if (!client) {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set on the server. Run: ' +
          'supabase secrets set ANTHROPIC_API_KEY=sk-ant-...',
      )
    }
    client = new Anthropic({ apiKey })
  }
  return client
}

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

export interface AskOptions {
  system: string
  messages: Anthropic.MessageParam[]
  maxTokens: number
  effort: Effort
  /** A JSON Schema. When given, the reply is guaranteed to match it. */
  schema?: Record<string, unknown>
}

export interface AskResult {
  text: string
  parsed: unknown
  stopReason: string | null
}

/**
 * One call to Claude.
 *
 * Notes for whoever changes this later:
 *   - We do NOT send `thinking`. On this model family thinking is on by
 *     default, and `budget_tokens` is rejected with a 400.
 *   - Depth is set with output_config.effort.
 *   - JSON is requested with output_config.format, not by prefilling the
 *     assistant turn (prefill returns a 400 on this model).
 */
export async function askClaude(opts: AskOptions): Promise<AskResult> {
  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: opts.messages,
    output_config: opts.schema
      ? { effort: opts.effort, format: { type: 'json_schema', schema: opts.schema } }
      : { effort: opts.effort },
  }

  const response = await anthropic().messages.create(
    body as Anthropic.MessageCreateParamsNonStreaming,
  )

  // Safety classifiers can decline a request with HTTP 200. Check first.
  if (response.stop_reason === 'refusal') {
    throw new Error(
      'The AI declined to answer this one. Try rewording it, or ask a scholar directly.',
    )
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()

  let parsed: unknown = null
  if (opts.schema) {
    const fromSdk = (response as { parsed_output?: unknown }).parsed_output
    if (fromSdk != null) {
      parsed = fromSdk
    } else {
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = null
      }
    }
  }

  return { text, parsed, stopReason: response.stop_reason ?? null }
}

/** Turns an SDK error into a message a learner can understand. */
export function friendlyError(err: unknown): { message: string; status: number } {
  if (err instanceof Anthropic.AuthenticationError) {
    return { message: 'The server key for the AI is wrong or missing.', status: 500 }
  }
  if (err instanceof Anthropic.RateLimitError) {
    return { message: 'Too many requests right now. Wait a moment and try again.', status: 429 }
  }
  if (err instanceof Anthropic.BadRequestError) {
    return { message: `The AI request was not valid: ${err.message}`, status: 400 }
  }
  if (err instanceof Anthropic.APIError) {
    return { message: `The AI service had a problem (${err.status}).`, status: 502 }
  }
  return {
    message: err instanceof Error ? err.message : 'Something went wrong.',
    status: 500,
  }
}
