/**
 * The SINGLE model boundary. This is the only module in the engine permitted to touch a
 * network: AXIOM A1 (the model is invoked at COMPILE TIME only) and AXIOM A9 (that single
 * compile-time call is the only outbound call Ada is allowed). Everything downstream —
 * excavate.ts, orchestrate.ts, the rubric gate, assembly — is pure and model-free (AXIOM
 * A3). The grep-guard tests assert `fetch`/`anthropic`/`openai` appear HERE and nowhere
 * else in the engine.
 */
export interface ModelClient {
  /** One compile-time completion. The only network the engine is permitted (A1/A9). */
  complete(prompt: string): Promise<string>;
}

/** The default boundary: no client configured yet. Throws rather than silently faking. */
export function notConfigured(): ModelClient {
  return {
    async complete(): Promise<string> {
      throw new Error(
        "No model configured. Inject a ModelClient — the real compile-time client lives " +
          "in engine/model.ts behind this interface (A1/A9: the only permitted outbound call).",
      );
    },
  };
}

/** Tuning for the live client. Defaults are conservative; never carries a key. */
export interface AnthropicOptions {
  /** Model id. Override via `ADA_MODEL` env or this arg; defaults to a current Claude. */
  model?: string;
  /** Output token ceiling for one excavation completion. */
  maxTokens?: number;
}

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
// The dated Messages API version header (stable contract, not a secret).
const ANTHROPIC_VERSION = "2023-06-01";
// Default to the most capable current Claude — the "first node must impress" bet (A8)
// rides on excavation quality. Override with ADA_MODEL (e.g. claude-sonnet-4-6) for
// faster/cheaper runs.
const DEFAULT_MODEL = "claude-opus-4-8";
const DEFAULT_MAX_TOKENS = 4096;

/** Narrow shape of the bits of the Messages response we read. */
interface MessagesResponse {
  content?: Array<{ type?: string; text?: string }>;
}

/**
 * The REAL compile-time client (AXIOM A1/A9). Uses Node 22 global `fetch` — NO SDK, NO new
 * dependency. The API key is read from `process.env.ANTHROPIC_API_KEY` ONLY: never
 * hardcoded, never defaulted, never logged. If the env var is absent we throw a clear,
 * actionable error rather than fall back to a fake response. The prompt is sent to the
 * Messages API but is NEVER logged, and the key is NEVER logged or echoed.
 *
 * Request/response shape verified against the Anthropic Messages API:
 *   POST /v1/messages  · headers: x-api-key, anthropic-version, content-type
 *   body: { model, max_tokens, messages:[{role:"user",content}] }
 *   response: { content: [{ type:"text", text }] }  (text blocks concatenated)
 */
export function anthropicClient(options: AnthropicOptions = {}): ModelClient {
  const model = options.model ?? process.env["ADA_MODEL"] ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  return {
    async complete(prompt: string): Promise<string> {
      // Key from env at call time (the CLI loads it from ./.env or ~/.ada/.env into
      // process.env at startup; env always wins). Never defaulted, never logged (A1/A9).
      const apiKey = process.env["ANTHROPIC_API_KEY"];
      if (!apiKey) {
        throw new Error(
          "ANTHROPIC_API_KEY is not set. The compile-time model call (AXIOM A1/A9) reads it " +
            "from the environment only — never hardcoded, never logged. Set it once:\n" +
            "  mkdir -p ~/.ada && printf 'ANTHROPIC_API_KEY=sk-ant-...\\n' >> ~/.ada/.env\n" +
            "  # or for this session: export ANTHROPIC_API_KEY=sk-ant-...\n" +
            '  then retry: ada compile --engine "<your intent>"   (check with: ada key)',
        );
      }

      let res: Response;
      try {
        res = await fetch(ANTHROPIC_MESSAGES_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": ANTHROPIC_VERSION,
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            messages: [{ role: "user", content: prompt }],
          }),
        });
      } catch (cause) {
        // Network-level failure. Surface a clean message WITHOUT the key or the prompt.
        const detail = cause instanceof Error ? cause.message : String(cause);
        throw new Error(`Anthropic request failed (network): ${detail}`);
      }

      if (!res.ok) {
        // Read the body for the API's own error text, but NEVER log the key or prompt.
        const body = await res.text().catch(() => "");
        const trimmed = body.slice(0, 500);
        throw new Error(
          `Anthropic API error ${res.status} ${res.statusText}` +
            (trimmed ? `: ${trimmed}` : ""),
        );
      }

      const data = (await res.json()) as MessagesResponse;
      const text = (data.content ?? [])
        .filter((b) => b.type === "text" && typeof b.text === "string")
        .map((b) => b.text as string)
        .join("");
      if (!text) {
        throw new Error(
          "Anthropic API returned no text content. Expected a content block of " +
            "type 'text'; got an empty or non-text response.",
        );
      }
      return text;
    },
  };
}
