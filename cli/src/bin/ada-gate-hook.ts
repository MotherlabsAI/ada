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
import { readFileSync, appendFileSync, mkdirSync, existsSync } from "fs";
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
    process.stdin.setEncoding("utf8");
    const parts: string[] = [];
    process.stdin.on("data", (c: string) => parts.push(c));
    process.stdin.on("end", () => resolve(parts.join("")));
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

function writeGateLog(
  projectDir: string,
  toolName: string,
  verdict: string,
  reasoning: string,
  filePath: string | undefined,
  violated: readonly string[],
): void {
  try {
    const adaDir = join(projectDir, ".ada");
    if (!existsSync(adaDir)) mkdirSync(adaDir, { recursive: true });
    const record = JSON.stringify({
      ts: Date.now(),
      toolName,
      verdict,
      reasoning,
      filePath,
      violated,
    });
    appendFileSync(join(adaDir, "gate-log.jsonl"), record + "\n", "utf8");
  } catch {
    // Best-effort — never crash on log write failure
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

  const projectDir =
    process.env["ADA_PROJECT_DIR"] ??
    process.env["CLAUDE_PROJECT_DIR"] ??
    process.cwd();

  if (result.verdict === "BLOCK") {
    writeGateLog(
      projectDir,
      toolName,
      "BLOCK",
      result.reasoning,
      filePath,
      result.violated,
    );
    process.stderr.write(
      `Ada gate: action blocked.\n${result.reasoning}${violated}${suggestion}\n`,
    );
    process.exit(2);
  }

  // AMEND_FIRST
  writeGateLog(
    projectDir,
    toolName,
    "AMEND_FIRST",
    result.reasoning,
    filePath,
    result.violated,
  );
  process.stderr.write(
    `Ada gate: amendment required.\n${result.reasoning}${violated}${suggestion}\n`,
  );
  process.exit(2);
}

main().catch(() => {
  process.stderr.write("Ada gate: internal error — failing closed\n");
  process.exit(2);
});
