/**
 * The TOOL CONTRACTS projection ("compile the family", brick 3 — what may be invoked, bounded).
 *
 * The family spec's rule: a capability is not "available" until it has a contract — a declared
 * authority, preconditions, allowed/forbidden effects, and a failure behavior. This projects the
 * bounded tool surface the governed agents (AGENTS.md) may call, each tied to AUTONOMY_CONTRACT.md
 * (brick 1) so no tool runs above its caller's granted level (AXIOM A4). Deterministic, model-free
 * (A3): a pure view, honest about whether the pack actually ships runnable checks (A2 — no false backing).
 */
import type { PackModel } from "../core/types.js";
import type { ExportFile } from "./claude.js";

/** Build the Tool Contracts markdown — the permissioned capability surface for this pack. */
export function projectToolContracts(model: PackModel): string {
  const checksLine = model.shipsRunnableChecks
    ? "purpose: run the pack's **runnable C-checks** (`c/checks/verify.mjs`) and emit a verdict"
    : "purpose: run the pack's checks — **no runnable checks yet** (κ candidates only); the executor must implement them first";
  return [
    `# Tool Contracts — ${model.slug}`,
    "",
    "> What the governed agents may invoke — permissioned, bounded, schema-shaped. A capability is not",
    "> available until it has a contract: required authority, preconditions, allowed/forbidden effects,",
    "> a failure behavior. Bound to `AUTONOMY_CONTRACT.md` (the ladder) and `AGENTS.md` (the callers).",
    "",
    "## tool: run-checks — authority A0 (read-only verification)",
    `- ${checksLine}`,
    "- preconditions: the pack is present and readable",
    "- allowed effects: read files; execute checks; write a verdict to the evidence ledger",
    "- forbidden effects: edit source; deploy; spend; network",
    "- on failure: name the failing check ids; **fail closed** — never pass on error",
    "- caller: verifier",
    "",
    "## tool: run-tests — authority A2 (sandbox; only when a human raised the caller to A2)",
    "- purpose: run the project test suite in a sandbox",
    "- preconditions: dependencies installed; no uncommitted destructive change; A2 granted",
    "- allowed effects: read; execute tests; write test logs",
    "- forbidden effects: delete files; modify production; access credentials; deploy",
    "- on failure: summarize; do not retry past the configured limit; write a residue entry",
    "- caller: implementer (A2+ only)",
    "",
    "## tool: edit-file — authority A2 (sandbox; only when a human raised the caller to A2)",
    "- purpose: propose/apply a diff INSIDE the implementer's allowed scope (the plan's Action ids)",
    "- preconditions: target inside the granted scope; A2 granted; reversible (sandbox or branch)",
    "- allowed effects: edit sandbox files; produce a patch",
    "- forbidden effects: edit production paths; merge; deploy; widen its own scope; touch secrets",
    "- on failure: revert the partial change; write a residue entry",
    "- caller: implementer (A2+ only)",
    "",
    "## Rule",
    "No tool runs above the caller's granted autonomy (AXIOM A4) — a tool with no contract is not",
    "callable. Every state-changing tool writes to the evidence ledger (`EVIDENCE_LEDGER.jsonl`), so",
    "no completion is claimed without a trace. Adding a new tool means adding a contract here first.",
    "",
  ].join("\n");
}

/** The Tool Contracts as an emitted pack file (written under the blueprint export dir). */
export function toolContractsExport(model: PackModel): ExportFile {
  return { path: "TOOL_CONTRACTS.md", content: projectToolContracts(model) };
}
