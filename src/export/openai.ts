/**
 * The OpenAI Agents export ("compile the family", brick 8 — completes the export quartet).
 *
 * Projects the governed set into the OpenAI Agents SDK shape: agents (instructions + handoffs),
 * handoffs (the bounded inter-agent payload), and guardrails (the authority/residue/fail-closed
 * rules). The same governed context Ada ships to Claude/Copilot/MCP, expressed where an OpenAI-SDK
 * agent runtime reads it. Deterministic JSON, model-free (A3); no capability beyond what the
 * autonomy + tool contracts already bound.
 */
import type { PackModel } from "../core/types.js";
import type { ExportFile } from "./claude.js";

interface OpenAiAgent {
  name: string;
  instructions: string;
  handoffs: string[];
}
interface Handoff {
  from: string;
  to: string;
  required_inputs: string[];
}
interface Guardrail {
  name: string;
  rule: string;
}

const AGENTS: OpenAiAgent[] = [
  {
    name: "governor",
    instructions:
      "Enforce AUTONOMY_CONTRACT.md. Approve/deny stage transitions; block any unsafe or unauthorized action; never raise an agent's autonomy. Authority A0.",
    handoffs: ["architect"],
  },
  {
    name: "architect",
    instructions:
      "Read POM.md (intent, constraints, unknowns). Decompose the plan's Actions into tasks; flag unknowns. Propose only — never edit source (A1).",
    handoffs: ["implementer"],
  },
  {
    name: "implementer",
    instructions:
      "Implement only the plan's Action nodes, bounded by AUTONOMY_CONTRACT.md. A1 (propose-only) unless a human raised you to A2; never widen your own scope; never merge/deploy/spend.",
    handoffs: ["verifier"],
  },
  {
    name: "verifier",
    instructions:
      "Run the pack's checks; emit a pass/fail verdict; BLOCK promotion. Fail closed — if a check cannot run, treat as failure, never a silent pass. Authority A0.",
    handoffs: [],
  },
];

const HANDOFFS: Handoff[] = [
  {
    from: "architect",
    to: "implementer",
    required_inputs: ["POM.md", "AUTONOMY_CONTRACT.md", "AGENTS.md"],
  },
  {
    from: "implementer",
    to: "verifier",
    required_inputs: ["TOOL_CONTRACTS.md", "EVIDENCE_LEDGER.jsonl"],
  },
];

const GUARDRAILS: Guardrail[] = [
  {
    name: "authority_floor",
    rule: "No agent acts above A1 (propose-only) without explicit human approval (AXIOM A4).",
  },
  {
    name: "respect_residue",
    rule: "An unresolved unknown (Ω) blocks action — never fill a hole with a guess.",
  },
  {
    name: "fail_closed",
    rule: "If a check cannot be run, fail closed — treat it as a failure, never a silent pass.",
  },
  {
    name: "no_invented_constraints",
    rule: "Honour only the POM constraint_graph; do not invent constraints.",
  },
];

/** Project the pack into the OpenAI Agents SDK config trio. Deterministic (fixed data, no Date/Map). */
export function openaiExports(model: PackModel): ExportFile[] {
  void model; // the governed set + rules are pack-invariant; the assets they cite live per-pack
  const j = (v: unknown): string => JSON.stringify(v, null, 2) + "\n";
  return [
    { path: "agents.json", content: j(AGENTS) },
    { path: "handoffs.json", content: j(HANDOFFS) },
    { path: "guardrails.json", content: j(GUARDRAILS) },
  ];
}
