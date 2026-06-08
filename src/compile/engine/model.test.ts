import { test } from "node:test";
import assert from "node:assert/strict";
import { deadline, resolveProvider, buildClaudeCodeArgs } from "./model.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Provider selection (borrow-the-harness: run on the Claude Code subscription, no API key) ──

test("resolveProvider: an explicit choice wins over everything (flag/env override)", () => {
  assert.equal(
    resolveProvider({ explicit: "api", env: {}, claudeAvailable: true }),
    "api",
  );
  assert.equal(
    resolveProvider({
      explicit: "claude-code",
      env: { ANTHROPIC_API_KEY: "sk-x" },
      claudeAvailable: false,
    }),
    "claude-code",
    "explicit claude-code is honored even with a key set",
  );
});

test("resolveProvider: ADA_MODEL_PROVIDER env is the next authority after an explicit flag", () => {
  assert.equal(
    resolveProvider({
      env: { ADA_MODEL_PROVIDER: "claude-code", ANTHROPIC_API_KEY: "sk-x" },
      claudeAvailable: false,
    }),
    "claude-code",
    "the env override beats a present API key (the user's case: key present but unusable)",
  );
});

test("resolveProvider: with no override, PREFER the Claude Code subscription when the binary is present (zero-key default)", () => {
  assert.equal(
    resolveProvider({ env: {}, claudeAvailable: true }),
    "claude-code",
    "the non-expert default: use the subscription that's already authenticated, no key needed",
  );
});

test("resolveProvider: falls back to the API key when claude is absent; to 'api' (clear no-key error) when neither", () => {
  assert.equal(
    resolveProvider({
      env: { ANTHROPIC_API_KEY: "sk-x" },
      claudeAvailable: false,
    }),
    "api",
    "no claude binary but a key → API",
  );
  assert.equal(
    resolveProvider({ env: {}, claudeAvailable: false }),
    "api",
    "neither available → API path, which surfaces the actionable no-key error",
  );
});

test("buildClaudeCodeArgs: headless, text out, single-turn, MCP/skills off — never --bare (it breaks subscription auth)", () => {
  const args = buildClaudeCodeArgs({});
  assert.ok(args.includes("-p"), "headless print mode");
  assert.deepEqual(
    [args[args.indexOf("--output-format") + 1]],
    ["text"],
    "text output (clean single string)",
  );
  assert.ok(args.includes("--strict-mcp-config"), "no MCP servers loaded");
  assert.ok(args.includes("--disable-slash-commands"), "no skills loaded");
  assert.ok(
    !args.includes("--bare"),
    "MUST NOT use --bare — it forces API-key auth and breaks the subscription",
  );
});

test("buildClaudeCodeArgs: a model override maps to claude --model; absent → no flag (claude's default)", () => {
  const withModel = buildClaudeCodeArgs({ model: "sonnet" });
  assert.equal(
    withModel[withModel.indexOf("--model") + 1],
    "sonnet",
    "the model is threaded to claude --model",
  );
  assert.ok(
    !buildClaudeCodeArgs({}).includes("--model"),
    "no model → let claude use its configured default",
  );
});

test("deadline aborts its signal after the budget elapses (MODELCALL.003: a hung call can't hang the compile)", async () => {
  const d = deadline(20);
  assert.equal(d.signal.aborted, false, "not aborted before the budget");
  await sleep(45);
  assert.equal(d.signal.aborted, true, "aborted once the budget elapsed");
  d.clear();
});

test("deadline.clear() cancels the abort — a call that returns in time is never aborted", async () => {
  const d = deadline(20);
  d.clear(); // the call returned: stop the timer
  await sleep(45);
  assert.equal(d.signal.aborted, false, "cleared timer never fires");
});

test("the abort signal is a real AbortSignal — wired to fetch's signal option", () => {
  const d = deadline(1000);
  assert.ok(
    typeof d.signal === "object" && "aborted" in d.signal,
    "deadline yields an AbortSignal fetch accepts",
  );
  d.clear();
});
