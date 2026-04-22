// Structured errors for the ada CLI (UX requirement R6/R7).
//
// Every non-zero exit path should emit a one-line "reason" and a one-line
// "next action" so users are never stranded with a bare stack trace. This
// module exposes:
//
//   - AdaErrorCode    — enum of well-known failure modes
//   - AdaErrorDetail  — the `{ reason, nextAction, exitCode }` shape
//   - AdaError        — Error subclass carrying a detail
//   - failWith(...)   — pretty-print to stderr and process.exit()
//   - wrap(...)       — normalize unknown thrown values into AdaError
//   - err.*           — factory helpers for the common cases
//
// Exit-code scheme:
//     0  non-fatal (used by TERMINAL_SPAWN_UNAVAILABLE — printed guidance, not a failure)
//     1  user/state error recoverable by re-running a command (state, usage)
//     2  environment setup issue (missing key, missing build, missing dep)
//     3  credential invalid — regenerate required
//    99  internal/unexpected — bug, please file an issue
//
// Pure TS, no deps, no side effects at import time.

import { glyphs } from "./ui/design-system.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdaErrorCode =
  | "MISSING_API_KEY"
  | "KEY_INVALID"
  | "KEY_FORMAT_SUSPICIOUS"
  | "OFFLINE"
  | "STATE_MISSING"
  | "STATE_CORRUPT"
  | "BUILD_REQUIRED"
  | "CLAUDE_CLI_MISSING"
  | "TERMINAL_SPAWN_UNAVAILABLE"
  | "PERMISSION_DENIED"
  | "STORAGE_UNWRITABLE"
  | "CONFIG_UNREADABLE"
  | "USAGE_ERROR"
  | "INTERNAL";

export interface AdaErrorDetail {
  readonly code: AdaErrorCode;
  readonly reason: string; // "what went wrong" — one line, no trailing punctuation
  readonly nextAction: string; // "what to do" — one line, imperative
  readonly exitCode: number;
  readonly context?: Record<string, string | number>;
}

// ---------------------------------------------------------------------------
// AdaError class
// ---------------------------------------------------------------------------

export class AdaError extends Error {
  readonly detail: AdaErrorDetail;

  constructor(detail: AdaErrorDetail) {
    super(detail.reason);
    this.name = "AdaError";
    this.detail = detail;
    // Preserve prototype chain when targeting older JS runtimes/tsconfigs.
    Object.setPrototypeOf(this, AdaError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAIL = glyphs.status.fail; // ✗
const ARROW = glyphs.pipeline.arrow; // →

/** Strip any trailing "." / "!" / "?" / whitespace — reasons end bare. */
function trimTrailingPunctuation(s: string): string {
  return s.replace(/\s+$/u, "").replace(/[.!?\s]+$/u, "");
}

function formatContext(
  context: Record<string, string | number> | undefined,
): string | null {
  if (!context) return null;
  const keys = Object.keys(context);
  if (keys.length === 0) return null;
  const parts = keys.map((k) => `${k}=${context[k]}`);
  return `context: ${parts.join(", ")}`;
}

/**
 * Pretty-print a structured error to stderr in the canonical format and
 * terminate the process with the mapped exit code. Never returns.
 *
 *   ✗ <REASON>
 *   → <NEXT ACTION>
 *   context: key=val, key=val   (if context is present)
 */
export function failWith(detail: AdaErrorDetail): never {
  const reason = trimTrailingPunctuation(detail.reason);
  const nextAction = detail.nextAction.trim();

  process.stderr.write(`${FAIL} ${reason}\n`);
  process.stderr.write(`${ARROW} ${nextAction}\n`);

  const ctx = formatContext(detail.context);
  if (ctx) process.stderr.write(`${ctx}\n`);

  process.exit(detail.exitCode);
  // Unreachable, but keeps TS `never` inference honest when exit is mocked.
  throw new AdaError(detail);
}

/**
 * Normalize any caught value into an AdaError. If the value is already an
 * AdaError, pass it through unchanged. Otherwise wrap with code INTERNAL and
 * preserve the original message (and stack when available) for debugging.
 */
export function wrap(err: unknown, fallbackHint?: string): AdaError {
  if (err instanceof AdaError) return err;

  let message: string;
  if (err instanceof Error) {
    message = err.message || err.name || "unknown error";
  } else if (typeof err === "string") {
    message = err;
  } else {
    try {
      message = JSON.stringify(err);
    } catch {
      message = String(err);
    }
  }

  const reason = fallbackHint
    ? `${fallbackHint}: ${trimTrailingPunctuation(message)}`
    : `unexpected internal error: ${trimTrailingPunctuation(message)}`;

  const wrapped = new AdaError({
    code: "INTERNAL",
    reason,
    nextAction: "file an issue with the stack trace above",
    exitCode: 99,
  });

  // Preserve the original stack so the "stack trace above" hint is truthful.
  if (err instanceof Error && err.stack) {
    wrapped.stack = err.stack;
  }

  return wrapped;
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

export const err = {
  missingApiKey(provider?: string): AdaErrorDetail {
    const label = provider ? `${provider} API key` : "API key";
    const base = {
      code: "MISSING_API_KEY" as const,
      reason: `no ${label} configured`,
      nextAction: "set ANTHROPIC_API_KEY or run `ada config set-key`",
      exitCode: 2,
    };
    return provider ? { ...base, context: { provider } } : base;
  },

  keyInvalid(provider: string, status?: number): AdaErrorDetail {
    const context: Record<string, string | number> = { provider };
    if (typeof status === "number") context.status = status;
    return {
      code: "KEY_INVALID",
      reason: `${provider} rejected the API key`,
      nextAction: "regenerate your key at console.anthropic.com",
      exitCode: 3,
      context,
    };
  },

  stateMissing(): AdaErrorDetail {
    return {
      code: "STATE_MISSING",
      reason: "no ada state found in this directory",
      nextAction: 'run `ada init "<intent>"` in this directory first',
      exitCode: 1,
    };
  },

  stateCorrupt(path: string): AdaErrorDetail {
    return {
      code: "STATE_CORRUPT",
      reason: "ada state file is unreadable or malformed",
      nextAction: "inspect the file or run `ada clean` and recompile",
      exitCode: 1,
      context: { path },
    };
  },

  buildRequired(): AdaErrorDetail {
    return {
      code: "BUILD_REQUIRED",
      reason: "the ada CLI is not built",
      nextAction: "run `pnpm -F @ada/cli build` from the repo root",
      exitCode: 2,
    };
  },

  claudeCliMissing(): AdaErrorDetail {
    return {
      code: "CLAUDE_CLI_MISSING",
      reason: "`claude` CLI not found on PATH",
      nextAction: "install the `claude` CLI",
      exitCode: 2,
    };
  },

  terminalSpawnUnavailable(scriptPath?: string): AdaErrorDetail {
    const next = scriptPath
      ? `open a new shell and run: bash ${scriptPath}`
      : "open a new shell and run: bash <scriptPath>";
    const base = {
      code: "TERMINAL_SPAWN_UNAVAILABLE" as const,
      reason: "no supported terminal emulator detected",
      nextAction: next,
      exitCode: 0,
    };
    return scriptPath ? { ...base, context: { scriptPath } } : base;
  },

  usage(message: string): AdaErrorDetail {
    return {
      code: "USAGE_ERROR",
      reason: trimTrailingPunctuation(message) || "invalid command usage",
      nextAction: "run `ada --help`",
      exitCode: 1,
    };
  },

  internal(reason: string): AdaErrorDetail {
    return {
      code: "INTERNAL",
      reason: trimTrailingPunctuation(reason) || "unexpected internal error",
      nextAction: "file an issue with the stack trace above",
      exitCode: 99,
    };
  },
} as const;
