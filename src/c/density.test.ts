/**
 * Density-gate wire proof (FREEZE.md §4, 4-a; AXIOM A3). Proves the salience-budget
 * predicate is wired into the C-run path: an over-budget emitted CLAUDE.md FAILS, an
 * in-budget one PASSES, and the gate is pure / model-free (no data fixture required).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { densityCheck } from "./run.js";
import { CLAUDE_MD_BUDGET_BYTES } from "../export/salience.js";

async function packWithClaudeMd(content: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "ada-density-"));
  const claudeDir = join(root, "exports", "claude");
  await mkdir(claudeDir, { recursive: true });
  await writeFile(join(claudeDir, "CLAUDE.md"), content, "utf8");
  return root;
}

test("densityCheck PASSES an in-budget CLAUDE.md on disk", async () => {
  const root = await packWithClaudeMd("# tiny\n\n- MUST: x (`A` — a)\n");
  const r = densityCheck(root);
  assert.ok(r);
  assert.equal(r!.pass, true);
  assert.equal(r!.name, "claude_md_within_salience_budget");
});

test("densityCheck FAILS an over-budget CLAUDE.md on disk", async () => {
  const root = await packWithClaudeMd(
    "# big\n" + "x".repeat(CLAUDE_MD_BUDGET_BYTES + 1),
  );
  const r = densityCheck(root);
  assert.ok(r);
  assert.equal(r!.pass, false);
  assert.ok(r!.violations.length > 0);
});

test("densityCheck returns null when there is no emitted CLAUDE.md", async () => {
  const root = await mkdtemp(join(tmpdir(), "ada-density-empty-"));
  assert.equal(densityCheck(root), null);
});
