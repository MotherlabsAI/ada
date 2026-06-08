import { test } from "node:test";
import assert from "node:assert/strict";
import {
  projectSettings,
  projectSettingsJson,
  settingsExports,
} from "./settings.js";
import type { PackModel } from "../core/types.js";

const model = (shipsRunnableChecks = false): PackModel =>
  ({
    slug: "demo",
    shipsRunnableChecks,
    graph: { nodes: [], edges: [] },
  }) as unknown as PackModel;

test("settings.json is valid JSON with allow/ask/deny + the two hook events", () => {
  const json = projectSettingsJson(model());
  const parsed = JSON.parse(json);
  assert.ok(parsed.permissions.allow.length, "has an allow tier");
  assert.ok(parsed.permissions.ask.length, "has an ask tier");
  assert.ok(parsed.permissions.deny.length, "has a deny tier");
  assert.ok(parsed.hooks.PreToolUse.length, "wires a PreToolUse hook");
  assert.ok(parsed.hooks.PostToolUse.length, "wires a PostToolUse hook");
});

test("the A1 floor: edits/commits are ASK (human raises authority), never silent allow", () => {
  const { permissions } = projectSettings(model());
  // file mutation is A2+ — it must be gated, not auto.
  for (const op of ["Edit", "Write"]) {
    assert.ok(permissions.ask.includes(op), `${op} is human-gated (ask)`);
    assert.ok(!permissions.allow.includes(op), `${op} is not auto-allowed`);
  }
  assert.ok(
    permissions.ask.some((r) => /git commit/.test(r)),
    "commits are gated",
  );
});

test("the A5 floor: secrets + destructive + exfiltration are DENIED outright", () => {
  const { deny } = projectSettings(model()).permissions;
  const joined = deny.join("\n");
  assert.match(joined, /\.env/, "secret reads denied");
  assert.match(joined, /secrets\/\*\*/, "secrets dir denied");
  assert.match(joined, /rm -rf/, "destructive rm denied");
  assert.match(joined, /git push --force/, "force-push denied");
  assert.match(joined, /curl/, "exfiltration via curl denied");
});

test("honesty (A2): the runnable verifier is allowed only when the pack ships it", () => {
  const withChecks = projectSettings(model(true)).permissions.allow.join("\n");
  const without = projectSettings(model(false)).permissions.allow.join("\n");
  assert.match(withChecks, /c\/checks\/verify\.mjs/, "ships checks → allowed");
  assert.doesNotMatch(
    without,
    /c\/checks\/verify\.mjs/,
    "no checks → not claimed as an allowed tool (no false backing)",
  );
});

test("settingsExports emits settings.json + both hook scripts", () => {
  const files = settingsExports(model());
  const paths = files.map((f) => f.path).sort();
  assert.deepEqual(paths, [
    "hooks/post-tool-use-ledger.mjs",
    "hooks/pre-tool-use-gate.mjs",
    "settings.json",
  ]);
});

test("the PreToolUse gate is a deterministic deny floor (blocks secrets + destructive, defers the rest)", () => {
  const gate = settingsExports(model()).find((f) =>
    f.path.endsWith("pre-tool-use-gate.mjs"),
  )!;
  assert.match(
    gate.content,
    /permissionDecision/,
    "uses the deny decision API",
  );
  assert.match(gate.content, /SECRET/, "has a secret matcher");
  assert.match(gate.content, /DESTRUCTIVE/, "has a destructive matcher");
  assert.match(
    gate.content,
    /process\.exit\(0\)/,
    "defers (exit 0) when not on the floor",
  );
});

test("the PostToolUse hook appends to the brick-4 evidence ledger", () => {
  const led = settingsExports(model()).find((f) =>
    f.path.endsWith("post-tool-use-ledger.mjs"),
  )!;
  assert.match(led.content, /EVIDENCE_LEDGER\.jsonl/, "targets the ledger");
  assert.match(led.content, /appendFileSync/, "appends (never rewrites)");
  assert.match(led.content, /toISOString/, "runtime entries carry wall-clock");
});

test("deterministic: same model in → byte-identical settings out (INVARIANT.003)", () => {
  assert.equal(projectSettingsJson(model()), projectSettingsJson(model()));
  const a = settingsExports(model(true)).map((f) => f.content);
  const b = settingsExports(model(true)).map((f) => f.content);
  assert.deepEqual(a, b);
});
