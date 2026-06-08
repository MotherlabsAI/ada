/**
 * The ENFORCED-GOVERNANCE projection ("compile the family", brick 7 — soft contract → hard boundary).
 *
 * Bricks 1–6 emit the *descriptive* governance layer: the Autonomy Contract (the A0–A5 ladder), the
 * Tool Contracts (what may be invoked), the Agent Charters, the Evidence Ledger. All of it is context
 * the executor is asked to honour — advisory. This brick projects the *enforced* layer Claude Code
 * actually obeys deterministically (NORTH-STAR K8 — no action without scope/permission/rollback):
 *
 *   - `settings.json` — the permission boundary. The A1 floor of AUTONOMY_CONTRACT.md, made literal:
 *       read-only + verification → allow · file edits / commits / installs → ask (the human raises to
 *       A2+) · secret reads / destructive / exfiltration / force-push → deny (A5-class, never auto).
 *   - `hooks/pre-tool-use-gate.mjs` — deterministic deny floor BEFORE a tool runs (not "the model was
 *       told not to" but "the model was blocked").
 *   - `hooks/post-tool-use-ledger.mjs` — appends every state-changing call to the evidence ledger
 *       (brick 4), so no completion is claimed without a trace.
 *
 * The seam is "Ada emits the contract; Claude Code runs it" (AXIOM A6): these are static *artifacts*,
 * not a runtime — emitting them is on-spine, running them is the borrowed harness. Deterministic and
 * model-free (A3): fixed key order, no wall-clock in the emit (INVARIANT.003); the hooks stamp time at
 * runtime, which is exactly where brick 4 says wall-clock belongs. Honesty-gated (A2): the run-checks
 * allow-rule is emitted only when the pack actually ships a runnable verifier — no false backing.
 */
import type { PackModel } from "../core/types.js";
import type { ExportFile } from "./claude.js";

/** The settings.json shape we emit (a subset of Claude Code's schema — the part we govern). */
export interface CompiledSettings {
  $schema: string;
  permissions: { allow: string[]; ask: string[]; deny: string[] };
  hooks: {
    PreToolUse: HookRule[];
    PostToolUse: HookRule[];
  };
}
interface HookRule {
  matcher: string;
  hooks: { type: "command"; command: string }[];
}

const hookCmd = (file: string): string =>
  `node "$CLAUDE_PROJECT_DIR/.claude/hooks/${file}"`;

/**
 * Project the permission boundary from the pack. The allow/ask/deny tiers ARE the A1 floor of the
 * Autonomy Contract made enforceable: propose-only by default, every irreversible move gated.
 */
export function projectSettings(model: PackModel): CompiledSettings {
  // A2 honesty: only claim the verifier as an allowed tool if the pack actually ships it.
  const verify = model.shipsRunnableChecks
    ? ["Bash(node c/checks/verify.mjs:*)"]
    : [];

  return {
    $schema: "https://json.schemastore.org/claude-code-settings.json",
    permissions: {
      // A0/A1 — read-only inspection + verification: safe to auto-run.
      allow: [
        "Bash(git status:*)",
        "Bash(git diff:*)",
        "Bash(git log:*)",
        "Bash(ls:*)",
        "Bash(cat:*)",
        "Bash(rg:*)",
        "Bash(grep:*)",
        ...verify,
      ],
      // A2+ — touches files, history, or dependencies: the human raises authority (AXIOM A4).
      ask: [
        "Edit",
        "Write",
        "Bash(git add:*)",
        "Bash(git commit:*)",
        "Bash(git push:*)",
        "Bash(npm install:*)",
        "Bash(pnpm install:*)",
        "Bash(npm test:*)",
        "Bash(pnpm test:*)",
      ],
      // A5-class — irreversible / exfiltration / secret access: never auto, contract-only.
      deny: [
        "Read(./.env)",
        "Read(./.env.*)",
        "Read(./secrets/**)",
        "Read(./**/*.pem)",
        "Bash(rm -rf:*)",
        "Bash(sudo:*)",
        "Bash(git push --force:*)",
        "Bash(curl:*)",
        "Bash(wget:*)",
      ],
    },
    hooks: {
      PreToolUse: [
        {
          matcher: "Bash|Edit|Write|Read",
          hooks: [
            { type: "command", command: hookCmd("pre-tool-use-gate.mjs") },
          ],
        },
      ],
      PostToolUse: [
        {
          matcher: "Edit|Write|Bash",
          hooks: [
            { type: "command", command: hookCmd("post-tool-use-ledger.mjs") },
          ],
        },
      ],
    },
  };
}

/** Deterministic JSON for settings.json — fixed key order, no wall-clock (INVARIANT.003). */
export function projectSettingsJson(model: PackModel): string {
  return JSON.stringify(projectSettings(model), null, 2) + "\n";
}

/**
 * The PreToolUse gate: a deterministic DENY floor that runs before any matched tool. It only blocks
 * the A5-class floor (secret reads/writes, destructive + exfiltration commands); everything else
 * exits 0 silently and falls through to settings.json + the human. Emitted as a static artifact.
 */
const PRE_TOOL_USE_GATE = `#!/usr/bin/env node
// Ada PreToolUse gate (compile-the-family, brick 7). EMITTED by the Ada compiler — do not edit by
// hand; re-compiling the pack overwrites it. Reads the hook event JSON on stdin and denies the
// irreversible / exfiltration / secret-access floor the Autonomy Contract keeps above A1 (AXIOM A4).
// Anything not on the floor exits 0 (silent) -> normal settings.json + human permission flow.
import { readFileSync } from "node:fs";

let evt = {};
try {
  evt = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0); // malformed event -> fail safe: defer, do not crash the tool call
}

const tool = evt.tool_name || "";
const input = evt.tool_input || {};
const path = String(input.file_path || "");
const cmd = String(input.command || "");

const SECRET = /(^|\\/)\\.env($|\\.)|(^|\\/)secrets\\/|\\.pem$/i;
const DESTRUCTIVE = /\\brm\\s+-rf\\b|\\bsudo\\b|git\\s+push\\s+--force|\\bcurl\\b|\\bwget\\b|:\\(\\)\\s*\\{/i;

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

if ((tool === "Read" || tool === "Edit" || tool === "Write") && SECRET.test(path)) {
  deny("Ada gate: secret access (.env / secrets/ / *.pem) is denied — A5-class, never auto (AXIOM A4).");
}
if (tool === "Bash" && DESTRUCTIVE.test(cmd)) {
  deny("Ada gate: destructive or exfiltration command denied — requires an explicit A5 contract (approval + rollback + audit).");
}
process.exit(0);
`;

/**
 * The PostToolUse ledger hook: appends one compact JSON line per state-changing tool call to the
 * evidence ledger (brick 4's EVIDENCE_LEDGER.jsonl). Runtime entries carry a wall-clock timestamp —
 * brick 4 reserves time for runtime, not the seed. Never blocks the runtime on a write failure.
 */
const POST_TOOL_USE_LEDGER = `#!/usr/bin/env node
// Ada PostToolUse ledger (compile-the-family, brick 7 -> brick 4). EMITTED by the Ada compiler — do
// not edit by hand. Appends one compact JSON line per state-changing tool call so no completion is
// claimed without a trace (AGENTS.md / TOOL_CONTRACTS.md). Ledger path: $ADA_EVIDENCE_LEDGER, else
// <cwd>/.claude/EVIDENCE_LEDGER.jsonl (the runtime continuation of the compiled seed ledger).
import { readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

let evt = {};
try {
  evt = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const tool = evt.tool_name || "unknown";
const input = evt.tool_input || {};
const target = String(input.file_path || input.command || "").slice(0, 200);
const cwd = evt.cwd || process.cwd();
const ledger =
  process.env.ADA_EVIDENCE_LEDGER || join(cwd, ".claude", "EVIDENCE_LEDGER.jsonl");

const entry = {
  event: "tool",
  tool,
  target,
  ts: new Date().toISOString(),
  requires_verification: true,
};

try {
  mkdirSync(dirname(ledger), { recursive: true });
  appendFileSync(ledger, JSON.stringify(entry) + "\\n");
} catch {
  // never block the runtime on a ledger-write failure
}
process.exit(0);
`;

/**
 * The enforced-governance bundle: the permission boundary + the two hooks. Installed under `.claude/`
 * (the install prompt copies these in), making the family's authority deterministic, not advisory.
 */
export function settingsExports(model: PackModel): ExportFile[] {
  return [
    { path: "settings.json", content: projectSettingsJson(model) },
    { path: "hooks/pre-tool-use-gate.mjs", content: PRE_TOOL_USE_GATE },
    { path: "hooks/post-tool-use-ledger.mjs", content: POST_TOOL_USE_LEDGER },
  ];
}
