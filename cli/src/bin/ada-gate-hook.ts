#!/usr/bin/env node
/**
 * ada-gate-hook — PreToolUse hook entrypoint.
 *
 * Reads the Claude Code PreToolUse JSON payload from stdin, invokes the
 * semantic gate against the compiled blueprint, and returns an exit code
 * that Claude Code interprets:
 *
 *   exit 0 — ALLOW (or fallback when disabled / no blueprint)
 *   exit 2 — BLOCK (stderr contains the reason shown to the model)
 *   exit 1 — AMEND_FIRST (stderr contains the amendment suggestion)
 *
 * This binary is intentionally minimal: no Ink, no React, no MCP transport,
 * no heavy deps. It loads the blueprint from .ada/state.json, calls the
 * governor's evaluateSemanticGate, and exits. Cold start is ~50ms plus the
 * LLM call.
 *
 * Fail-open by default. Set ADA_GATE_STRICT=1 to fail-closed on unavailable
 * LLM or missing key. Set ADA_GATE_MODE=off to disable entirely.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { evaluateSemanticGate } from "@ada/governor";
import type { Blueprint } from "@ada/compiler";

interface PreToolUsePayload {
  readonly tool_name?: string;
  readonly tool_input?: Record<string, unknown>;
  readonly session_id?: string;
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () =>
      resolve(Buffer.concat(chunks).toString("utf8")),
    );
    process.stdin.on("error", () => resolve(""));
  });
}

function loadBlueprint(): Blueprint | null {
  const projectDir =
    process.env["ADA_PROJECT_DIR"] ??
    process.env["CLAUDE_PROJECT_DIR"] ??
    process.cwd();
  const statePath =
    process.env["ADA_STATE_PATH"] ?? join(projectDir, ".ada", "state.json");
  try {
    const raw = readFileSync(statePath, "utf8");
    const parsed = JSON.parse(raw) as { blueprint?: Blueprint };
    return parsed.blueprint ?? null;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  // Fast early exits
  if ((process.env["ADA_GATE_MODE"] ?? "").toLowerCase() === "off") {
    process.exit(0);
  }

  const raw = await readStdin();
  if (!raw.trim()) {
    process.exit(0);
  }

  let payload: PreToolUsePayload;
  try {
    payload = JSON.parse(raw) as PreToolUsePayload;
  } catch {
    process.exit(0);
  }

  const toolName = payload.tool_name;
  if (!toolName) {
    process.exit(0);
  }

  const blueprint = loadBlueprint();
  if (!blueprint) {
    // No compiled blueprint — nothing to gate against
    process.exit(0);
  }

  const input = payload.tool_input ?? {};
  const filePath =
    typeof input["file_path"] === "string"
      ? (input["file_path"] as string)
      : typeof input["path"] === "string"
        ? (input["path"] as string)
        : undefined;
  const content =
    typeof input["content"] === "string"
      ? (input["content"] as string)
      : typeof input["new_string"] === "string"
        ? (input["new_string"] as string)
        : undefined;
  const command =
    typeof input["command"] === "string"
      ? (input["command"] as string)
      : undefined;

  const result = await evaluateSemanticGate(blueprint, {
    toolName,
    ...(filePath !== undefined ? { filePath } : {}),
    ...(content !== undefined ? { content } : {}),
    ...(command !== undefined ? { command } : {}),
  });

  if (result.verdict === "ALLOW") {
    process.exit(0);
  }

  const violated =
    result.violated.length > 0
      ? `\nViolated: ${result.violated.join("; ")}`
      : "";
  const suggestion = result.suggested ? `\nSuggested: ${result.suggested}` : "";

  if (result.verdict === "BLOCK") {
    process.stderr.write(
      `Ada gate: action blocked.\n${result.reasoning}${violated}${suggestion}\n`,
    );
    process.exit(2);
  }

  // AMEND_FIRST
  process.stderr.write(
    `Ada gate: amendment required.\n${result.reasoning}${violated}${suggestion}\n`,
  );
  process.exit(2);
}

main().catch(() => {
  // Unhandled error — fail-open
  process.exit(0);
});
