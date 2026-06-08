/**
 * THE PRODUCTION CONTRACT — the ship-gates this loop closed, as enforced checks.
 *
 * The `ada-prod` map (Ada compiling its own production-readiness) named the gaps; the loop fixed
 * the real ones. This pins each fix as a runnable invariant so a future change can't silently
 * REGRESS the hardening (the same discipline as designContract.test.ts: a check over a judgment).
 * Source-scanning, deterministic, model-free (A3). Each assertion cites the map id it locks.
 *
 * NOT a claim that Ada is production-ready — that verdict is Alex's (C0–C2). This only guarantees
 * the specific gaps that were closed STAY closed.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = (p: string): string =>
  readFileSync(join(process.cwd(), "src", p), "utf8");

test("MODELCALL.003 — the model call has an abort budget (a hung connection can't hang the compile)", () => {
  const m = src("compile/engine/model.ts");
  assert.match(m, /deadline\(/, "the abort-budget helper is used");
  assert.match(
    m,
    /signal:\s*budget\.signal/,
    "the budget is wired into fetch's signal",
  );
});

test("INVARIANT.002 — the pack is written atomically (a crash keeps the previous pack canonical)", () => {
  const w = src("pack/writer.ts");
  assert.match(
    w,
    /atomicReplace\(/,
    "writePack goes through the backup/restore transaction",
  );
});

test("TERM.001 — the TUI restores the terminal on crash/SIGTERM (no shell left in raw mode)", () => {
  const c = src("cli.ts");
  assert.match(
    c,
    /armTerminalRestore\(/,
    "the terminal safety net is armed for the interactive TUI",
  );
});

test("TERM.003 — colour is gated, never raw ANSI into a pipe (non-TTY → plain text)", () => {
  const g = src("core/grammar.ts");
  assert.match(
    g,
    /if \(!colourEnabled\) return text/,
    "paint() drops escapes when colour is disabled",
  );
});

test("UNK.004 — the CLI fails non-zero (the exit-code contract holds)", () => {
  const c = src("cli.ts");
  assert.match(
    c,
    /process\.exitCode = 1/,
    "a failure path sets a non-zero exit code",
  );
  assert.match(
    c,
    /main\(\)\.catch/,
    "the top-level catch sets the failure exit code",
  );
});

test("POM — the unique-function output is emitted AND operable (executor reads it)", () => {
  assert.match(
    src("pack/writer.ts"),
    /pomExport\(model\)/,
    "the POM is written on every compile",
  );
  assert.match(
    src("export/claude.ts"),
    /POM\.md/,
    "the executor export points agents at the POM",
  );
});

test("SELF-IMPROVE — a self-patch is gated (no-gate-weakening + quality non-regression)", () => {
  const s = src("governance/selfImprove.ts");
  assert.match(s, /checkGateWeakening/, "the anti-corruption gate exists");
  assert.match(s, /checkQuality/, "the quality non-regression gate exists");
  assert.match(
    s,
    /gateCheck\.ok && quality\.ok/,
    "promotion requires BOTH gates to pass",
  );
});
