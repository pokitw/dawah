/**
 * Minimal type shims for the Deno edge-function runtime.
 *
 * Deno is not installed in this project (the functions run on Supabase), but
 * declaring these lets `tsc` type-check the edge function source along with
 * the rest of the code, and lets the tests import the shared modules. They
 * describe only the small surface these functions actually use.
 *
 * Supabase's own deploy step does the real Deno type-check.
 */

declare namespace Deno {
  const env: {
    get(key: string): string | undefined
  }
  function serve(handler: (req: Request) => Response | Promise<Response>): unknown
}

declare module 'jsr:@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js'
}

declare module 'jsr:@supabase/functions-js/edge-runtime.d.ts' {
  const value: unknown
  export default value
}

declare module 'npm:@anthropic-ai/sdk@^0.127.0' {
  // The SDK is not installed locally (Deno fetches it at deploy time), so
  // this is a loose stand-in that matches only what these functions use.
  interface AnthropicMessage {
    stop_reason: string | null
    content: { type: string; text?: string }[]
    parsed_output?: unknown
  }

  interface AnthropicClient {
    messages: { create(body: unknown): Promise<AnthropicMessage> }
  }

  type AnthropicCtor = {
    new (opts: { apiKey: string }): AnthropicClient
    AuthenticationError: new (...args: never[]) => Error
    RateLimitError: new (...args: never[]) => Error
    BadRequestError: new (...args: never[]) => Error & { message: string }
    APIError: new (...args: never[]) => Error & { status: number }
  }

  const Anthropic: AnthropicCtor

  namespace Anthropic {
    type MessageParam = { role: 'user' | 'assistant'; content: string }
    type MessageCreateParamsNonStreaming = Record<string, unknown>
    type TextBlock = { type: 'text'; text: string }
    type Message = AnthropicMessage
  }

  type Anthropic = AnthropicClient

  export default Anthropic
}
