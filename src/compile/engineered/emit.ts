/**
 * Emits the engineered node L2C.001 to disk: the fat node folder, runnable C checks
 * (zero-dep .mjs + a --defect fixture), and the blueprint/Claude/subagent projections.
 * Regenerable — re-running rewrites the same artifact from `l2c001.ts`.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { toYaml } from "../../core/serialize.js";
import { paths } from "../../pack/layout.js";
import { clusterOf, nodeDirName } from "../../core/ids.js";
import { L2C001 } from "./l2c001.js";

const N = L2C001;

function contextYaml(): unknown {
  return {
    id: N.id,
    label: N.label,
    glyph: "◇",
    display: N.display,
    cluster: N.cluster,
    status: N.status,
    semantic_role: {
      type: N.role.type,
      purpose: N.role.purpose,
      bounded_claim: N.role.boundedClaim,
    },
    input_contract: {
      accepts: N.ioContract.accepts,
      required: N.ioContract.required,
      optional: N.ioContract.optional,
    },
    output_contract: { emits: N.ioContract.emits },
    local_context: {
      summary: N.localContext.summary,
      why_it_matters: N.localContext.whyItMatters,
      failure_if_missing: N.localContext.failureIfMissing,
    },
    epistemics: {
      truth_status: N.epistemics.truthStatus,
      source_status: N.epistemics.sourceStatus,
      confidence_default: N.epistemics.confidence,
      requires_human_review_when: N.epistemics.requiresHumanReviewWhen,
    },
    checkability: {
      class: N.checkability.class,
      explanation:
        "Partly checkable (dedup, definitions, residue, name alignment); naming taste + MVP inclusion are human-gated.",
    },
  };
}

function nodeMd(): string {
  const cand = N.cCandidates.map((c) => `  κ ${c.id}`).join("\n");
  const res = N.residue.map((r) => `  Ω ${r.term}`).join("\n");
  return [
    `# ${N.display}`,
    "",
    `cluster: ${N.cluster.id} / ${N.cluster.label}   ·   checkability: ${N.checkability.class}   ·   export: ${N.exportTargets.join(",")}`,
    "",
    "## Primitive",
    "User nouns often become durable domain/software entities.",
    "",
    "## Meaning",
    N.localContext.summary,
    "",
    "## Compiles to",
    "  " + N.entityCandidates.map((e) => e.canonicalName).join(", "),
    "",
    "## C candidates",
    cand,
    "",
    "## Residue",
    res,
    "",
    "See `wiki.md` (full article), `entity-candidates.yaml` (work product), `c-candidates.yaml` + `c/checks/entity/` (runnable).",
    "",
  ].join("\n");
}

function wikiMd(): string {
  const nouns = N.entityCandidates.map((e) => e.canonicalName).join("\n");
  return [
    `# ◇ ${N.id} — ${N.label}`,
    "",
    "## ⟡ Primitive",
    "Nouns in user language are often the first visible signs of software entities. A durable object may become a table, model, type, API resource, UI screen, wiki section, agent task, or C check target.",
    "",
    "## ∴ Meaning",
    N.localContext.summary,
    "",
    "## Why it matters",
    N.localContext.whyItMatters,
    "Example: the user says “booking” and a naive agent invents Booking, Appointment, CalendarEvent, ScheduleSlot, Reservation — duplicated concepts, weak relationships, broken checks. This node forces noun normalization early.",
    "",
    "## ! Failure if missing",
    ...N.localContext.failureIfMissing.map((f) => `- ${f}`),
    "",
    "## Input example",
    "Extracted nouns → candidate entities:",
    "```",
    nouns,
    "```",
    "Ambiguous (held as residue): " +
      N.ambiguousNouns.map((a) => a.term).join(", "),
    "",
    "## ⊢ Compiles to",
    "canonical entity registry · data schema · model + route names · UI screens · permissions · Claude tasks · C candidates · wiki entity dictionary",
    "",
    "## κ Checkability",
    `Class ${N.checkability.class}. Deterministic: ${N.checkability.deterministicSurface.join(", ")}. Not deterministic: ${N.checkability.notDeterministic.join(", ")}.`,
    "",
    "## Ω Residue",
    ...N.residue.map((r) => `- ${r.term} — ${r.reason}`),
    "",
    "## ↔ Links",
    "Parents: " + N.edges.parents.map((e) => e.id).join(", "),
    "Children: " + N.edges.children.map((e) => e.id).join(", "),
    "Siblings: " + N.edges.siblings.map((e) => e.id).join(", "),
    "",
  ].join("\n");
}

// ── runnable C (.mjs) ────────────────────────────────────────────────────────────
const CHECK_NDB = [
  'export const name = "schema.no_duplicate_entity_names";',
  "export function run(data) {",
  "  const seen = new Set(); const dup = new Set();",
  "  for (const e of data.entities || []) {",
  "    const n = String(e.canonicalName).trim().toLowerCase();",
  "    if (seen.has(n)) dup.add(e.canonicalName);",
  "    seen.add(n);",
  "  }",
  "  const violations = [...dup].map((x) => ({ kind: 'duplicate_entity', canonicalName: x }));",
  "  return { name, pass: violations.length === 0, violations };",
  "}",
  "",
].join("\n");

const CHECK_PED = [
  'export const name = "schema.primary_entities_have_definitions";',
  "const PRIMARY = ['primary_domain_entity', 'primary_workflow_entity', 'financial_entity', 'actor_entity'];",
  "export function run(data) {",
  "  const violations = (data.entities || [])",
  "    .filter((e) => PRIMARY.includes(e.classification) && !(e.definition && String(e.definition).trim()))",
  "    .map((e) => ({ kind: 'undefined_primary_entity', canonicalName: e.canonicalName }));",
  "  return { name, pass: violations.length === 0, violations };",
  "}",
  "",
].join("\n");

const CHECK_ANP = [
  'export const name = "residue.ambiguous_nouns_preserved";',
  "export function run(data) {",
  "  const kept = new Set((data.residue || []).map((r) => String(r.term).trim().toLowerCase()));",
  "  const violations = (data.ambiguous || [])",
  "    .map((n) => String(n.term).trim())",
  "    .filter((t) => !kept.has(t.toLowerCase()))",
  "    .map((t) => ({ kind: 'lost_ambiguity', term: t }));",
  "  return { name, pass: violations.length === 0, violations };",
  "}",
  "",
].join("\n");

function fixturesMjs(): string {
  const entities = N.entityCandidates.map((e) => ({
    id: e.id,
    canonicalName: e.canonicalName,
    classification: e.classification,
    definition: e.definition,
  }));
  const ambiguous = N.ambiguousNouns.map((a) => ({ term: a.term }));
  const cleanResidue = N.residue.map((r) => ({ term: r.term }));
  return [
    "// Clean satisfies every L2C.001 invariant. withDefect plants three failures:",
    "// a duplicate 'Appointment', a primary entity with no definition, and dropped residue.",
    "export const clean = {",
    "  entities: " + JSON.stringify(entities) + ",",
    "  ambiguous: " + JSON.stringify(ambiguous) + ",",
    "  residue: " + JSON.stringify(cleanResidue) + ",",
    "};",
    "export const withDefect = {",
    "  entities: [",
    "    ...clean.entities,",
    "    { id: 'ENTITY.booking', canonicalName: 'Appointment', classification: 'primary_workflow_entity', definition: '' },",
    "  ],",
    "  ambiguous: clean.ambiguous,",
    "  residue: [{ term: 'command center' }],", // drops 'content' and 'AI automations'
    "};",
    "",
  ].join("\n");
}

const VERIFY_MJS = [
  "// Runnable verifier for L2C.001 — Nouns -> Entities.",
  "//   node verify-l2c-001.mjs           clean data (expect all pass)",
  "//   node verify-l2c-001.mjs --defect  planted defects (expect all 3 FAIL)",
  "//   add --json for machine output",
  "import * as ndb from './no-duplicate-entity-names.mjs';",
  "import * as ped from './primary-entities-have-definitions.mjs';",
  "import * as anp from './ambiguous-nouns-preserved.mjs';",
  "import { clean, withDefect } from './fixtures.mjs';",
  "",
  "const checks = [ndb, ped, anp];",
  "const useDefect = process.argv.includes('--defect');",
  "const data = useDefect ? withDefect : clean;",
  "const results = checks.map((c) => c.run(data));",
  "const passed = results.filter((r) => r.pass).length;",
  "const report = { fixture: useDefect ? 'withDefect' : 'clean', total: results.length, passed, failed: results.length - passed, results };",
  "",
  "if (process.argv.includes('--json')) {",
  "  process.stdout.write(JSON.stringify(report, null, 2) + '\\n');",
  "} else {",
  "  for (const r of results) {",
  "    console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + r.name);",
  "    if (!r.pass) for (const v of r.violations) console.log('    -> ' + JSON.stringify(v));",
  "  }",
  "  console.log('');",
  "  console.log(report.passed + '/' + report.total + ' passed (' + report.fixture + ')');",
  "}",
  "process.exit(report.failed > 0 ? 1 : 0);",
  "",
].join("\n");

// ── projections ──────────────────────────────────────────────────────────────────
function dataModelMd(): string {
  const rows = N.entityCandidates
    .map(
      (e) =>
        `| ${e.canonicalName} | ${e.classification} | ${e.ambiguity ? "Ambiguous — " + e.ambiguity[0] : (e.riskHints?.[0] ?? "—")} |`,
    )
    .join("\n");
  return [
    "# DATA_MODEL.md — projected from L2C.001",
    "",
    "Use these canonical entities unless later context overrides them.",
    "",
    "| Entity | Classification | Notes |",
    "|---|---|---|",
    rows,
    "",
    "## Rule",
    "Claude Code MUST NOT create additional primary domain entities unless it records them in `proposed_entities.yaml` and explains why existing entities do not cover it, where it appears in context, whether it is MVP-required, and whether it creates new C checks.",
    "",
    "## Warnings",
    "- Do not use `User` as a synonym for `Client`.",
    "- Do not split `Booking` and `Appointment` unless the workflow requires it.",
    "- Do not model `Deposit` as a loose number if reconciliation matters.",
    "- Do not treat `Review` as trusted proof without a `source` field.",
    "- Do not implement `Automation` until its trigger/action/scope is defined.",
    "",
  ].join("\n");
}

function claudeContextMd(): string {
  return [
    "# Claude instruction — generated by L2C.001 (Nouns → Entities)",
    "",
    "Before implementing models, routes, components, or services, read this node's",
    "`entity-candidates.yaml`, `alias-map.yaml`, and `checkability.yaml`. Use the canonical",
    "entity registry as the source of truth for domain objects.",
    "",
    "## Hard rules",
    "1. Do not silently introduce new primary entities.",
    "2. Do not use `User` when the context means `Client`, `StaffMember`, or an authenticated account.",
    "3. Do not create both `Booking` and `Appointment` unless the blueprint separates them.",
    "4. Financial entities require amount, currency, status, and source/reference fields.",
    "5. Preserve ambiguous nouns as residue instead of guessing.",
    "6. If you need a new entity, write it to `proposed_entities.yaml` first, then ask or mark residue.",
    "",
    "Verify with: `node c/checks/entity/verify-l2c-001.mjs`",
    "",
  ].join("\n");
}

const SUBAGENT_MD = [
  "---",
  "name: ada-entity-mapper",
  "description: Convert raw user intent into domain entities, schema candidates, route/UI objects, and Claude Code context — without overcommitting. Use before any data-model work.",
  "---",
  "",
  "# Ada Entity Mapper",
  "",
  "Convert raw nouns into stable domain entities without overcommitting.",
  "",
  "## Read first",
  "- `nodes/L2C/001-nouns-to-entities/context.yaml`",
  "- `nodes/L2C/001-nouns-to-entities/entity-candidates.yaml`",
  "- `nodes/L2C/001-nouns-to-entities/alias-map.yaml`",
  "",
  "## Procedure",
  "1. Extract noun phrases. 2. Classify each (primary/workflow/financial/actor/proof/content/automation/attribute/action/view/document/ambiguous). 3. Canonicalize names. 4. Merge aliases. 5. Preserve ambiguous nouns as residue. 6. Emit registry updates + C candidates. 7. Do NOT implement code.",
  "",
  "## Output",
  "Write updates to `entity-candidates.yaml`, `alias-map.yaml`, `c-candidates.yaml`, and `residue.md`.",
  "",
].join("\n");

// ── emit ─────────────────────────────────────────────────────────────────────────
export async function emitL2C001(cwd: string, slug: string): Promise<string[]> {
  const p = paths(cwd, slug);
  // Use the SAME path logic the writer + reader use, so `ada deeper` finds this wiki.
  const dir = join(p.nodesDir, clusterOf(N.id), nodeDirName(N.id, N.label));
  const checksDir = join(p.cDir, "checks", "entity");
  await mkdir(dir, { recursive: true });
  await mkdir(checksDir, { recursive: true });
  await mkdir(p.blueprintDir, { recursive: true });
  await mkdir(p.claudeAgentsDir, { recursive: true });

  const written: string[] = [];
  const w = async (path: string, content: string) => {
    await writeFile(path, content, "utf8");
    written.push(path.replace(cwd + "/", ""));
  };

  // node folder
  await w(join(dir, "context.yaml"), toYaml(contextYaml()));
  await w(
    join(dir, "entity-candidates.yaml"),
    toYaml({
      candidate_entities: N.entityCandidates,
      ambiguous_nouns: N.ambiguousNouns,
    }),
  );
  await w(
    join(dir, "alias-map.yaml"),
    toYaml({ node_id: N.id, aliases: N.aliasMap }),
  );
  await w(join(dir, "edges.yaml"), toYaml({ node_id: N.id, ...N.edges }));
  await w(
    join(dir, "checkability.yaml"),
    toYaml({ node_id: N.id, ...N.checkability, C_possible: N.cCandidates }),
  );
  await w(
    join(dir, "c-candidates.yaml"),
    toYaml({
      candidates: N.cCandidates.map((c) => ({
        ...c,
        export: `c/checks/entity/${c.id}.mjs`,
      })),
    }),
  );
  await w(
    join(dir, "subnodes.yaml"),
    toYaml({
      node_id: N.id,
      subnodes: N.subnodes.map((label, i) => ({
        id: `${N.id}.${String(i + 1).padStart(2, "0")}`,
        label,
      })),
    }),
  );
  await w(
    join(dir, "quality.yaml"),
    toYaml({
      node_id: N.id,
      quality_gates: N.qualityGates,
      genericness_risk: "low",
      first_node_impression: "strong",
    }),
  );
  await w(
    join(dir, "export.yaml"),
    toYaml({ node_id: N.id, targets: N.exportTargets }),
  );
  await w(join(dir, "NODE.md"), nodeMd());
  await w(join(dir, "wiki.md"), wikiMd());

  // runnable C
  await w(join(checksDir, "no-duplicate-entity-names.mjs"), CHECK_NDB);
  await w(join(checksDir, "primary-entities-have-definitions.mjs"), CHECK_PED);
  await w(join(checksDir, "ambiguous-nouns-preserved.mjs"), CHECK_ANP);
  await w(join(checksDir, "fixtures.mjs"), fixturesMjs());
  await w(join(checksDir, "verify-l2c-001.mjs"), VERIFY_MJS);

  // projections
  await w(join(p.blueprintDir, "DATA_MODEL.md"), dataModelMd());
  await w(join(p.claudeDir, "CONTEXT-l2c-001.md"), claudeContextMd());
  await w(join(p.claudeAgentsDir, "ada-entity-mapper.md"), SUBAGENT_MD);

  return written;
}
