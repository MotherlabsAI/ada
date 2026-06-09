/**
 * Verifier-namespace write firewall (ada-autonomy-gaps PLAN.002 / EXEC.002 / REPAIR.001 — "the
 * generator cannot write its own judge"). The keystone of a TRUSTWORTHY autonomous loop: when a build
 * agent can't make a check pass, it must not be able to "fix" it by editing the check (Goodhart — a
 * green earned by editing the satisfaction surface is a lie, not a fix). The compiler computes, AT
 * COMPILE TIME, the judge's namespace — the C-checks, the tests, the registry, the validation schemas —
 * and denies the runtime executor writing into it. The deny-set is enforced by the PreToolUse hook
 * (settings.ts), so it is a deterministic gate BEFORE a write, not "the model was told not to". Pure (A3).
 */
import type { PackModel } from "../core/types.js";
import type { ExportFile } from "../export/claude.js";

/**
 * The judge's namespace as path globs. Writing any of these is the generator authoring/altering its
 * own verifier — forbidden. (Ada's COMPILER produces checks deterministically; the autonomous EXECUTOR
 * may never edit them during repair.)
 */
export function verifierDenyGlobs(): string[] {
  return [
    "c/checks/**", // the deterministic C-checks — the judge
    "c/registry.yaml", // which checks run, at what class
    "**/*.test.*", // the test suites
    "schemas/**", // the validation schemas (structural judge)
    "**/*.schema.json",
  ];
}

const DENY_RE: RegExp[] = [
  /(^|\/)c\/checks\//,
  /(^|\/)c\/registry\.ya?ml$/,
  /\.test\.[a-z]+$/,
  /(^|\/)schemas\//,
  /\.schema\.json$/,
];

/** True iff `path` is in the verifier namespace (the executor must not write it). */
export function isVerifierPath(path: string): boolean {
  return DENY_RE.some((re) => re.test(path));
}

/** Project the write firewall: the deny-set + the anti-Goodhart rule + how the runtime enforces it. */
export function projectWriteFirewall(model: PackModel): ExportFile {
  return {
    path: "WRITE_FIREWALL.md",
    content: [
      `# Write Firewall — ${model.slug}`,
      "",
      "> **The generator cannot write its own judge.** An autonomous build that can't pass a check must",
      "> never be allowed to make it green by editing the check — a green earned by editing the",
      "> satisfaction surface is a lie, not a fix (anti-Goodhart, REPAIR.001). The compiler computes the",
      "> judge's namespace here; the runtime DENIES the executor writing it (enforced, not advised).",
      "",
      "## denied namespace (the judge — read-only to the build agent)",
      ...verifierDenyGlobs().map((g) => `- \`${g}\``),
      "",
      "## the rule",
      "The micro-executor's write capability = the artifact closure of the blueprint (its declared",
      "build targets) MINUS the denied namespace above. A repair patch that touches a denied path is",
      "rejected BEFORE it lands — it is a verifier-tamper, not a fix. The build may add NEW checks via",
      "the governed compile path (which a human gates), never silently rewrite an existing one.",
      "",
      "## enforcement",
      "Deterministic, at the `PreToolUse` hook (`.claude/hooks/pre-tool-use-gate.mjs`, settings.ts):",
      "a write whose target matches the deny-set is `permissionDecision: deny` before the tool runs —",
      "the same seam that already denies secret/destructive writes. No model is in this gate (A3).",
      "",
    ].join("\n"),
  };
}
