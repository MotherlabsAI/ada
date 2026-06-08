/**
 * THE README IS A VERIFIED FRONT DOOR — not prose that rots.
 *
 * A first-time user (or Alex, who hit exactly this wall) needs an entry point, and every command
 * it documents must be REAL. This pins the README to the CLI: every `ada <verb>` mentioned must be
 * an actual dispatch case in cli.ts. A future command rename that doesn't update the README trips
 * this — the door can't drift from the building. Source-scanning, deterministic, model-free (A3).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const readmePath = join(root, "README.md");

/** The real command surface: every `case "<verb>":` in the CLI dispatch. */
function dispatchVerbs(): Set<string> {
  const cli = readFileSync(join(root, "src", "cli.ts"), "utf8");
  const verbs = new Set<string>();
  for (const m of cli.matchAll(/case "([a-z][a-z-]*)":/g)) verbs.add(m[1]!);
  return verbs;
}

test("the README exists — the tool has a front door", () => {
  assert.ok(
    existsSync(readmePath),
    "README.md must exist at the repo root (a user's entry point)",
  );
});

test("every `ada <verb>` the README documents is a real CLI command (no invented door — A2)", () => {
  const readme = readFileSync(readmePath, "utf8");
  const verbs = dispatchVerbs();
  // Sub-words that follow a command but aren't themselves the verb (e.g. `ada c run`, `ada ctx init`).
  const subwords = new Set(["run", "init"]);
  const documented = new Set<string>();
  for (const m of readme.matchAll(/\bada ([a-z][a-z-]+)/g)) {
    const verb = m[1]!;
    if (!subwords.has(verb)) documented.add(verb);
  }
  assert.ok(documented.size > 0, "the README actually shows commands");
  for (const verb of documented) {
    assert.ok(
      verbs.has(verb),
      `README documents \`ada ${verb}\` but cli.ts has no such dispatch case`,
    );
  }
});

test("the README names the key contract honestly (env / ~/.ada/.env, never committed — A9)", () => {
  const readme = readFileSync(readmePath, "utf8");
  assert.match(
    readme,
    /ANTHROPIC_API_KEY/,
    "the README tells the user how the one outbound call is authorized",
  );
  assert.match(
    readme,
    /~\/\.ada\/\.env/,
    "and where the key lives (local, gitignored)",
  );
});
