/**
 * The SINGLE model boundary. This is the only module in the engine permitted to touch a
 * network: AXIOM A1 (the model is invoked at COMPILE TIME only) and AXIOM A9 (that single
 * compile-time call is the only outbound call Ada is allowed). Everything downstream —
 * excavate.ts, orchestrate.ts, the rubric gate, assembly — is pure and model-free (AXIOM
 * A3). The grep-guard tests assert `fetch`/`anthropic`/`openai` appear HERE and nowhere
 * else in the engine.
 *
 * Two providers sit behind the one `ModelClient` seam (A9 — still a single compile-time call):
 *   • `anthropicClient` — the direct Messages API (needs ANTHROPIC_API_KEY, pay-per-token).
 *   • `claudeCodeClient` — BORROWS the local `claude` CLI in headless mode, so the call runs on
 *     the user's Claude Code SUBSCRIPTION with NO API key. This is the "borrow the harness, don't
 *     build the runtime" axiom applied to billing: sovereignty (A9) is stronger, not weaker —
 *     Ada stores no key; auth lives in Claude Code's own credential store.
 * `resolveProvider` picks between them; `defaultModelClient` builds the chosen one.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";

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
  /** Wall-clock budget for one call before it aborts. Env `ADA_MODEL_TIMEOUT_MS` else 120s. */
  timeoutMs?: number;
}

/** Default per-call wall-clock ceiling — a hung connection must not hang the whole compile. */
const DEFAULT_TIMEOUT_MS = 120_000;
/**
 * The Claude Code provider is slower per call than the raw API: each completion is a fresh `claude`
 * process (cold-start) plus generation, measured at ~45–75s for a real excavation/normalize prompt.
 * So it gets a much higher default ceiling than the API path — a single slow call must not abort
 * the whole compile. Still overridable via ADA_MODEL_TIMEOUT_MS / `timeoutMs`.
 */
const CLAUDE_CODE_DEFAULT_TIMEOUT_MS = 300_000;

/**
 * An abort budget: aborts the returned signal after `ms`, with a `clear()` to cancel the timer
 * on a normal return. Pure timer logic (the timer is unref'd so it never holds the process open),
 * so the timeout contract is unit-testable without a network. MODELCALL.003 (production-ready).
 */
export function deadline(ms: number): {
  signal: AbortSignal;
  clear: () => void;
} {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  (t as { unref?: () => void }).unref?.();
  return { signal: ac.signal, clear: () => clearTimeout(t) };
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
  const envTimeout = Number(process.env["ADA_MODEL_TIMEOUT_MS"]);
  const timeoutMs =
    options.timeoutMs ??
    (Number.isFinite(envTimeout) && envTimeout > 0
      ? envTimeout
      : DEFAULT_TIMEOUT_MS);
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

      // Abort budget (MODELCALL.003): a hung connection must not hang the whole compile.
      const budget = deadline(timeoutMs);
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
          signal: budget.signal,
        });
      } catch (cause) {
        // A timeout aborts the request — surface it as a timeout, not a generic network error.
        if (budget.signal.aborted) {
          throw new Error(
            `Anthropic request timed out after ${timeoutMs}ms with no response. ` +
              "Retry, or raise the budget via ADA_MODEL_TIMEOUT_MS.",
          );
        }
        // Network-level failure. Surface a clean message WITHOUT the key or the prompt.
        const detail = cause instanceof Error ? cause.message : String(cause);
        throw new Error(`Anthropic request failed (network): ${detail}`);
      } finally {
        // Response headers are in hand (or it threw) — stop the abort timer either way.
        budget.clear();
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

// ── Provider B: borrow the Claude Code subscription (no API key) ─────────────────────────────

/** Which provider satisfies the one compile-time call. */
export type ModelProvider = "api" | "claude-code";

function isProvider(v: unknown): v is ModelProvider {
  return v === "api" || v === "claude-code";
}

/**
 * Decide which provider serves the compile-time call. Pure (env + availability in, choice out),
 * so the precedence is unit-testable with no spawn. Precedence, highest first:
 *   1. an explicit choice (a `--provider` flag),
 *   2. the `ADA_MODEL_PROVIDER` env (the user's case: a key is present but unusable → force CC),
 *   3. PREFER the Claude Code subscription when the `claude` binary is present — the zero-key
 *      default that makes a non-expert's first run work with no setup,
 *   4. else the API key if set, else 'api' (so the clear, actionable no-key error surfaces).
 */
export function resolveProvider(args: {
  explicit?: string | undefined;
  env: Record<string, string | undefined>;
  claudeAvailable: boolean;
}): ModelProvider {
  if (isProvider(args.explicit)) return args.explicit;
  if (isProvider(args.env["ADA_MODEL_PROVIDER"]))
    return args.env["ADA_MODEL_PROVIDER"] as ModelProvider;
  if (args.claudeAvailable) return "claude-code";
  if ((args.env["ANTHROPIC_API_KEY"] ?? "").trim()) return "api";
  return "api";
}

/**
 * Is the `claude` CLI on PATH? Synchronous PATH scan (no spawn) so it's cheap and side-effect
 * free. Used by `resolveProvider` to default to the subscription when it's actually available.
 */
export function claudeCodeAvailable(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const path = env["PATH"];
  if (!path) return false;
  return path
    .split(delimiter)
    .some((dir) => dir && existsSync(join(dir, "claude")));
}

/**
 * The headless `claude` argv for a one-shot text completion. NEVER `--bare` — bare mode forces
 * ANTHROPIC_API_KEY / apiKeyHelper auth and DROPS the subscription OAuth, defeating the whole
 * point (verified: `--bare` → "Not logged in"). `--strict-mcp-config`/`--disable-slash-commands`
 * keep OAuth while skipping the user's MCP servers + skills (cleaner, no tool use). Pure → testable.
 */
export function buildClaudeCodeArgs(opts: { model?: string } = {}): string[] {
  return [
    "-p",
    "--output-format",
    "text",
    "--strict-mcp-config",
    "--disable-slash-commands",
    ...(opts.model ? ["--model", opts.model] : []),
  ];
}

/**
 * BORROW the harness: run the compile-time call through the local `claude` CLI on the user's
 * subscription — no API key. The prompt goes in on STDIN (no ARG_MAX limit); the answer is read
 * from stdout (`--output-format text`). Run in a NEUTRAL cwd (a temp dir) so the target repo's
 * CLAUDE.md/hooks never load (which would be slow, polluting, and — inside Ada's own repo —
 * recursive). ANTHROPIC_API_KEY is STRIPPED from the child env so a present-but-dead key can't
 * route this to the paid API. Timeout via the same `deadline` budget, enforced by killing the child.
 */
export function claudeCodeClient(options: AnthropicOptions = {}): ModelClient {
  const model = options.model ?? process.env["ADA_MODEL"];
  const envTimeout = Number(process.env["ADA_MODEL_TIMEOUT_MS"]);
  const timeoutMs =
    options.timeoutMs ??
    (Number.isFinite(envTimeout) && envTimeout > 0
      ? envTimeout
      : CLAUDE_CODE_DEFAULT_TIMEOUT_MS);
  return {
    async complete(prompt: string): Promise<string> {
      const childEnv: Record<string, string | undefined> = { ...process.env };
      delete childEnv["ANTHROPIC_API_KEY"]; // force subscription auth (A9: no key in play)
      const args = buildClaudeCodeArgs(model ? { model } : {});
      return await new Promise<string>((resolve, reject) => {
        const child = spawn("claude", args, {
          cwd: tmpdir(),
          env: childEnv,
          stdio: ["pipe", "pipe", "pipe"],
        });
        let out = "";
        let err = "";
        const timer = setTimeout(() => {
          child.kill("SIGKILL");
          reject(
            new Error(
              `claude -p timed out after ${timeoutMs}ms. Raise ADA_MODEL_TIMEOUT_MS, or use ` +
                "--provider=api with ANTHROPIC_API_KEY set.",
            ),
          );
        }, timeoutMs);
        (timer as { unref?: () => void }).unref?.();
        child.stdout.on("data", (d) => (out += String(d)));
        child.stderr.on("data", (d) => (err += String(d)));
        child.on("error", (e) => {
          clearTimeout(timer);
          reject(
            new Error(
              `Could not run the 'claude' CLI (${e.message}). Install Claude Code and run ` +
                "`claude login`, or use --provider=api with ANTHROPIC_API_KEY set.",
            ),
          );
        });
        child.on("close", (code) => {
          clearTimeout(timer);
          const text = out.trim();
          if (code !== 0 || !text) {
            const detail = (err.trim() || text || `exit ${code}`).slice(0, 500);
            reject(
              new Error(
                `claude -p failed (${detail}). If it says "Not logged in", run \`claude login\`; ` +
                  "if it's a usage limit, wait or use --provider=api.",
              ),
            );
            return;
          }
          resolve(text);
        });
        child.stdin.write(prompt);
        child.stdin.end();
      });
    },
  };
}

/** Options for the provider-selecting default client: tuning + an explicit provider override. */
export interface DefaultClientOptions extends AnthropicOptions {
  /** Force a provider (a `--provider` flag). Undefined → `resolveProvider` decides. */
  provider?: string | undefined;
}

/**
 * The one door every caller goes through (engineCompile injects nothing → this picks the provider).
 * Borrows the Claude Code subscription by default when available (no key); honors an explicit
 * `--provider`/`ADA_MODEL_PROVIDER`; falls back to the API key. Still ONE compile-time call (A9).
 */
export function defaultModelClient(
  options: DefaultClientOptions = {},
): ModelClient {
  const provider = resolveProvider({
    explicit: options.provider,
    env: process.env,
    claudeAvailable: claudeCodeAvailable(),
  });
  const tuning: AnthropicOptions = {
    ...(options.model ? { model: options.model } : {}),
    ...(options.maxTokens ? { maxTokens: options.maxTokens } : {}),
    ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
  };
  return provider === "claude-code"
    ? claudeCodeClient(tuning)
    : anthropicClient(tuning);
}
