import * as fs from "fs";
import * as path from "path";
import { glyphs } from "../ui/design-system.js";

const STAGE_CODES = [
  "INT",
  "PER",
  "ENT",
  "PRO",
  "SYN",
  "VER",
  "GOV",
] as const;

type StageCode = (typeof STAGE_CODES)[number];

const STAGE_LABELS: Record<StageCode, string> = {
  INT: "Intent",
  PER: "Persona / Domain",
  ENT: "Entities",
  PRO: "Processes",
  SYN: "Synthesis / Blueprint",
  VER: "Verify / Audit",
  GOV: "Governor",
};

const PIPELINE_KEYS: Record<StageCode, string> = {
  INT: "intent",
  PER: "persona",
  ENT: "entity",
  PRO: "process",
  SYN: "synthesis",
  VER: "verify",
  GOV: "governor",
};

// ─── Helpers (defensive readers) ─────────────────────────────────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function asRecord(v: unknown): Record<string, unknown> {
  return isRecord(v) ? v : {};
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function formatPercent(n: number | null): string {
  if (n === null) return "not available";
  return `${(n * 100).toFixed(1)}%`;
}

function formatScalar(n: number | null, digits = 3): string {
  if (n === null) return "not available";
  return n.toFixed(digits);
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "not available";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}m ${secs}s`;
}

function truncateOneLine(text: string | null, max = 120): string {
  if (text === null) return "not available";
  const firstLine = text.split(/\r?\n/)[0]?.trim() ?? "";
  if (firstLine.length === 0) return "not available";
  if (firstLine.length <= max) return firstLine;
  return firstLine.slice(0, max - 1) + "…";
}

// ─── State locators ──────────────────────────────────────────────────────────

function getStageArtifact(
  pipelineState: Record<string, unknown>,
  code: StageCode,
): Record<string, unknown> | null {
  const key = PIPELINE_KEYS[code];
  const v = pipelineState[key];
  return isRecord(v) ? v : null;
}

function getStageRecord(
  compilationRun: Record<string, unknown>,
  code: StageCode,
): Record<string, unknown> | null {
  const stages = asArray(compilationRun.stages);
  for (const s of stages) {
    if (isRecord(s) && s.stageCode === code) return s;
  }
  return null;
}

function getStagePostcode(
  artifact: Record<string, unknown> | null,
  record: Record<string, unknown> | null,
): string | null {
  if (artifact !== null) {
    const pc = asRecord(artifact.postcode);
    const raw = asString(pc.raw);
    if (raw !== null) return raw;
  }
  if (record !== null) {
    const pc = asRecord(record.postcode);
    const raw = asString(pc.raw);
    if (raw !== null) return raw;
  }
  return null;
}

function getStageDurationMs(
  record: Record<string, unknown> | null,
): number | null {
  if (record === null) return null;
  const meta = asRecord(record.metadata);
  return asNumber(meta.callDurationMs);
}

function getGateEntropy(
  pipelineState: Record<string, unknown>,
  code: StageCode,
  artifact: Record<string, unknown> | null,
): number | null {
  const gates = asRecord(pipelineState.gates);
  // Try direct lookup by stage code
  const direct = gates[code];
  if (isRecord(direct)) {
    const e = asNumber(direct.entropyEstimate);
    if (e !== null) return e;
  }
  // Try lookup by any gate whose toPostcode matches the artifact postcode
  const targetPostcode = artifact
    ? asString(asRecord(artifact.postcode).raw)
    : null;
  if (targetPostcode !== null) {
    for (const g of Object.values(gates)) {
      if (!isRecord(g)) continue;
      if (g.toPostcode === targetPostcode) {
        const e = asNumber(g.entropyEstimate);
        if (e !== null) return e;
      }
    }
  }
  // Fall back to scanning for an entropy-bearing field on the artifact itself
  return null;
}

// ─── Takeaways per stage ─────────────────────────────────────────────────────

interface Takeaway {
  readonly lines: readonly string[];
}

function takeawayINT(a: Record<string, unknown> | null): Takeaway {
  if (a === null) return { lines: ["artifact not available"] };
  const goals = asArray(a.goals);
  const constraints = asArray(a.constraints);
  const unknowns = asArray(a.unknowns);
  const blockingUnknowns = unknowns.filter(
    (u) => isRecord(u) && u.impact === "blocking",
  ).length;
  const raw = asString(a.rawIntent);
  return {
    lines: [
      `goals: ${goals.length}`,
      `constraints: ${constraints.length}`,
      `unknowns: ${unknowns.length} (${blockingUnknowns} blocking)`,
      `raw intent: ${truncateOneLine(raw, 100)}`,
    ],
  };
}

function takeawayPER(a: Record<string, unknown> | null): Takeaway {
  if (a === null) return { lines: ["artifact not available"] };
  const domain = asString(a.domain);
  const stakeholders = asArray(a.stakeholders);
  const ubiquitous = isRecord(a.ubiquitousLanguage)
    ? Object.keys(a.ubiquitousLanguage).length
    : 0;
  const excluded = asArray(a.excludedConcerns);
  return {
    lines: [
      `domain: ${domain ?? "not available"}`,
      `stakeholders: ${stakeholders.length}`,
      `ubiquitous language terms: ${ubiquitous}`,
      `excluded concerns: ${excluded.length}`,
    ],
  };
}

function takeawayENT(a: Record<string, unknown> | null): Takeaway {
  if (a === null) return { lines: ["artifact not available"] };
  const entities = asArray(a.entities);
  const bcs = asArray(a.boundedContexts);
  let totalInvariants = 0;
  let totalProperties = 0;
  for (const e of entities) {
    if (!isRecord(e)) continue;
    totalInvariants += asArray(e.invariants).length;
    totalProperties += asArray(e.properties).length;
  }
  return {
    lines: [
      `entities: ${entities.length}`,
      `bounded contexts: ${bcs.length}`,
      `properties: ${totalProperties}`,
      `invariants: ${totalInvariants}`,
    ],
  };
}

function takeawayPRO(a: Record<string, unknown> | null): Takeaway {
  if (a === null) return { lines: ["artifact not available"] };
  const workflows = asArray(a.workflows);
  const stateMachines = asArray(a.stateMachines);
  let totalStates = 0;
  for (const sm of stateMachines) {
    if (!isRecord(sm)) continue;
    totalStates += asArray(sm.states).length;
  }
  return {
    lines: [
      `workflows: ${workflows.length}`,
      `state machines: ${stateMachines.length}`,
      `total states: ${totalStates}`,
    ],
  };
}

function takeawaySYN(a: Record<string, unknown> | null): Takeaway {
  if (a === null) return { lines: ["artifact not available"] };
  const summary = asString(a.summary);
  const architecture = asRecord(a.architecture);
  const components = asArray(architecture.components);
  const nonFunctional = asArray(a.nonFunctional);
  const openQuestions = asArray(a.openQuestions);
  const resolvedConflicts = asArray(a.resolvedConflicts);
  return {
    lines: [
      `summary: ${truncateOneLine(summary, 100)}`,
      `components: ${components.length}`,
      `non-functional requirements: ${nonFunctional.length}`,
      `open questions: ${openQuestions.length}`,
      `resolved conflicts: ${resolvedConflicts.length}`,
    ],
  };
}

function takeawayVER(a: Record<string, unknown> | null): Takeaway {
  if (a === null) return { lines: ["artifact not available"] };
  const coverage = asNumber(a.coverageScore);
  const coherence = asNumber(a.coherenceScore);
  const drifts = asArray(a.drifts);
  const gaps = asArray(a.gaps);
  const passed = typeof a.passed === "boolean" ? a.passed : null;
  return {
    lines: [
      `passed: ${passed === null ? "not available" : passed ? "yes" : "no"}`,
      `coverage: ${formatPercent(coverage)}`,
      `coherence: ${formatPercent(coherence)}`,
      `drifts: ${drifts.length}`,
      `gaps: ${gaps.length}`,
    ],
  };
}

function takeawayGOV(a: Record<string, unknown> | null): Takeaway {
  if (a === null) return { lines: ["artifact not available"] };
  const decision = asString(a.decision);
  const confidence = asNumber(a.confidence);
  const gatePassRate = asNumber(a.gatePassRate);
  const provenanceIntact =
    typeof a.provenanceIntact === "boolean" ? a.provenanceIntact : null;
  const reasons = asArray(a.rejectionReasons);
  const violations = asArray(a.violations);
  const nextAction = asString(a.nextAction);
  const lines: string[] = [
    `decision: ${decision ?? "not available"}`,
    `confidence: ${formatScalar(confidence)}`,
    `gate pass rate: ${formatPercent(gatePassRate)}`,
    `provenance intact: ${provenanceIntact === null ? "not available" : provenanceIntact ? "yes" : "no"}`,
    `violations: ${violations.length}`,
  ];
  if (reasons.length > 0) {
    lines.push(`rejection reasons (${reasons.length}):`);
    for (const r of reasons.slice(0, 5)) {
      const s = typeof r === "string" ? r : JSON.stringify(r);
      lines.push(`  - ${truncateOneLine(s, 100)}`);
    }
    if (reasons.length > 5) {
      lines.push(`  … and ${reasons.length - 5} more`);
    }
  }
  if (nextAction !== null) {
    lines.push(`next action: ${truncateOneLine(nextAction, 100)}`);
  }
  return { lines };
}

function takeawayFor(
  code: StageCode,
  artifact: Record<string, unknown> | null,
): Takeaway {
  switch (code) {
    case "INT":
      return takeawayINT(artifact);
    case "PER":
      return takeawayPER(artifact);
    case "ENT":
      return takeawayENT(artifact);
    case "PRO":
      return takeawayPRO(artifact);
    case "SYN":
      return takeawaySYN(artifact);
    case "VER":
      return takeawayVER(artifact);
    case "GOV":
      return takeawayGOV(artifact);
  }
}

// ─── Renderers ───────────────────────────────────────────────────────────────

interface StageView {
  readonly code: StageCode;
  readonly label: string;
  readonly postcode: string | null;
  readonly entropy: number | null;
  readonly durationMs: number | null;
  readonly takeaway: Takeaway;
  readonly present: boolean;
}

function buildStageView(
  code: StageCode,
  pipelineState: Record<string, unknown>,
  compilationRun: Record<string, unknown>,
): StageView {
  const artifact = getStageArtifact(pipelineState, code);
  const record = getStageRecord(compilationRun, code);
  return {
    code,
    label: STAGE_LABELS[code],
    postcode: getStagePostcode(artifact, record),
    entropy: getGateEntropy(pipelineState, code, artifact),
    durationMs: getStageDurationMs(record),
    takeaway: takeawayFor(code, artifact),
    present: artifact !== null || record !== null,
  };
}

function renderDetailed(view: StageView): void {
  const c = glyphs.chevron;
  console.log("");
  console.log(`  ${c} ${view.code}  ${view.label}`);
  console.log(`      postcode:  ${view.postcode ?? "not available"}`);
  console.log(`      entropy:   ${formatScalar(view.entropy)}`);
  console.log(`      duration:  ${formatDuration(view.durationMs)}`);
  if (!view.present) {
    console.log(`      takeaway:  not available (stage did not execute)`);
    console.log("");
    return;
  }
  console.log(`      takeaway:`);
  for (const line of view.takeaway.lines) {
    console.log(`        - ${line}`);
  }
  console.log("");
}

function renderCompact(view: StageView): void {
  const c = glyphs.chevron;
  const pc = view.postcode ?? "not available";
  const ent = formatScalar(view.entropy);
  const dur = formatDuration(view.durationMs);
  console.log(`  ${c} ${view.code}  ${view.label}`);
  console.log(`      postcode ${pc}  ·  entropy ${ent}  ·  ${dur}`);
  if (!view.present) {
    console.log(`      not available (stage did not execute)`);
  } else {
    // Show only the first 1–2 takeaway lines in compact form.
    const first = view.takeaway.lines[0];
    const second = view.takeaway.lines[1];
    if (first !== undefined) console.log(`      ${first}`);
    if (second !== undefined) console.log(`      ${second}`);
  }
  console.log("");
}

// ─── Command entry ───────────────────────────────────────────────────────────

export async function explainCommand(argv: string[]): Promise<void> {
  const statePath = path.join(process.cwd(), ".ada", "state.json");

  if (!fs.existsSync(statePath)) {
    console.error(
      "Error: no .ada/state.json found — run 'ada init' first to compile a blueprint",
    );
    process.exit(1);
    return;
  }

  let raw: string;
  try {
    raw = fs.readFileSync(statePath, "utf8");
  } catch (err) {
    console.error(
      `Error: failed to read .ada/state.json — ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
    return;
  }

  let state: unknown;
  try {
    state = JSON.parse(raw);
  } catch (err) {
    console.error(
      `Error: .ada/state.json is not valid JSON — ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
    return;
  }

  const s = asRecord(state);
  const pipelineState = asRecord(s.pipelineState);
  const compilationRun = asRecord(s.compilationRun);

  // Resolve optional positional stage code (first non-flag arg).
  let requested: StageCode | null = null;
  for (const arg of argv) {
    if (arg.startsWith("-")) continue;
    const upper = arg.toUpperCase();
    if ((STAGE_CODES as readonly string[]).includes(upper)) {
      requested = upper as StageCode;
    } else {
      console.error(
        `Error: unknown stage '${arg}' — expected one of ${STAGE_CODES.join(", ")}`,
      );
      process.exit(1);
      return;
    }
    break;
  }

  const runId = asString(s.runId) ?? "(unknown)";
  const c = glyphs.chevron;

  if (requested !== null) {
    const view = buildStageView(requested, pipelineState, compilationRun);
    console.log("");
    console.log(`  ${c} run ${runId} — stage ${requested}`);
    renderDetailed(view);
    return;
  }

  console.log("");
  console.log(`  ${c} run ${runId}`);
  for (const code of STAGE_CODES) {
    const view = buildStageView(code, pipelineState, compilationRun);
    renderCompact(view);
  }
}
