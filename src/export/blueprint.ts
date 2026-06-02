/** Deterministic build blueprint (spec cluster BLUEPRINT, AXIOM A1). */
import type { PackModel, NodeCapsule } from "../core/types.js";
import { clusterOf } from "../core/ids.js";
import { toJson } from "../core/serialize.js";
import { CHECK_FILES } from "../c/checkSources.js";
import type { ExportFile } from "./claude.js";

function cluster(model: PackModel, c: string): NodeCapsule[] {
  return model.graph.nodes.filter((n) => clusterOf(n.id) === c);
}

export function blueprintExports(model: PackModel): ExportFile[] {
  const { seed } = model;
  const tables = cluster(model, "DATA");
  const flows = cluster(model, "WORKFLOW");
  const acceptanceChecks = CHECK_FILES.map(
    (f) => `- MUST: ${f.invariant} (\`${f.name}\`)`,
  ).join("\n");

  const context: ExportFile = {
    path: "CONTEXT.md",
    content: [
      `# Context — ${seed.domain}`,
      "",
      seed.buildObjective,
      "",
      "## Known",
      ...seed.knownContext.map((k) => `- ${k}`),
      "",
      "## Deliberately open (do not invent answers)",
      ...seed.unknownContext.map((u) => `- ${u}`),
      "",
    ].join("\n"),
  };

  const blueprint: ExportFile = {
    path: "BLUEPRINT.md",
    content: [
      `# Blueprint — ${seed.domain}`,
      "",
      "## Scope",
      "Bookings, staff, clients, services, deposits, payments. The vertical slice that",
      "proves the trust loop: a booking feature guarded by deterministic checks.",
      "",
      "## Non-goals (P0)",
      "- Marketing campaigns, content library, reviews (modelled, not built yet)",
      "- Multi-location (open question)",
      "- Accounts / cloud sync",
      "",
      "## Target stack",
      "TypeScript · Node API · SQL database · typed ORM. Money in integer minor units.",
      "",
      "## Data model",
      ...tables.map((t) => `- **${t.label}** — ${t.localContext.summary}`),
      "",
      "## Services (verbs)",
      "- `book(serviceId, staffId, clientId, startsAt)` — rejects overlaps (no_double_booking)",
      "- `reschedule(bookingId, startsAt)` — preserves deposit, rejects overlaps",
      "- `cancel(bookingId)` — releases slot, applies policy",
      "- `capturePayment(bookingId, amountCents, kind)` — non-negative only",
      "",
      "## Workflows",
      ...flows.map((f) => `- **${f.label}** — ${f.localContext.summary}`),
      "",
      "## Build order",
      "See `TASK_GRAPH.json`. Schema and constraints first, then services, then UI.",
      "",
      "## Done",
      "Code satisfies `ACCEPTANCE.md` and `node c/checks/verify.mjs` passes on real data.",
      "",
    ].join("\n"),
  };

  const acceptance: ExportFile = {
    path: "ACCEPTANCE.md",
    content: [
      "# Acceptance Criteria",
      "",
      "Must-pass conditions (from must-language → acceptance, L2C.011):",
      "",
      acceptanceChecks,
      "- MUST: a cancelled booking never blocks its slot and is never charged.",
      "- MUST: a reschedule never creates an overlap and never loses the deposit.",
      "",
      "Verify with the pack's own harness — see `VERIFY.md`.",
      "",
    ].join("\n"),
  };

  const gates: ExportFile = {
    path: "GATES.md",
    content: [
      "# Human Gates (AXIOM A4 — humans govern, agents execute)",
      "",
      "- Payment capture / refund against real funds",
      "- Any handling of customer PII beyond local fixtures",
      "- Destructive migrations or data deletion",
      "- External sends (email/SMS to real clients)",
      "",
      "Stop and ask before crossing any gate.",
      "",
    ].join("\n"),
  };

  const verify: ExportFile = {
    path: "VERIFY.md",
    content: [
      "# Verify",
      "",
      "```bash",
      "node c/checks/verify.mjs                  # bundled clean dataset → all pass",
      "node c/checks/verify.mjs --defect         # planted double-booking → no_double_booking FAILS",
      "node c/checks/verify.mjs --data DATA.json  # run against your real data",
      "node c/checks/verify.mjs --json            # machine-readable",
      "```",
      "",
      "Wire these into CI so every change is guarded. A failing check blocks acceptance.",
      "",
    ].join("\n"),
  };

  const tasks = {
    version: "1",
    tasks: [
      {
        id: "T1",
        title: "Create database schema + constraints",
        produces: ["DATA.002"],
        dependsOn: [],
      },
      {
        id: "T2",
        title: "Seed entities: staff, clients, services",
        produces: ["DATA.003", "DATA.004", "DATA.005"],
        dependsOn: ["T1"],
      },
      {
        id: "T3",
        title: "Implement booking service with overlap rejection",
        produces: ["WORKFLOW.005"],
        dependsOn: ["T2"],
        guards: ["no_double_booking", "booking_well_formed"],
      },
      {
        id: "T4",
        title: "Implement payment/deposit ledger (integer minor units)",
        produces: ["DATA.007", "WORKFLOW.006"],
        dependsOn: ["T2"],
        guards: ["non_negative_payment"],
      },
      {
        id: "T5",
        title: "Reschedule + cancellation flows",
        produces: ["WORKFLOW.007", "WORKFLOW.008"],
        dependsOn: ["T3"],
        guards: ["no_double_booking"],
      },
      {
        id: "T6",
        title: "Calendar + payments UI",
        produces: ["UI"],
        dependsOn: ["T3", "T4"],
      },
      {
        id: "T7",
        title: "Wire C checks into CI",
        produces: ["VERIFY"],
        dependsOn: ["T3", "T4"],
      },
    ],
  };

  const taskGraph: ExportFile = {
    path: "TASK_GRAPH.json",
    content: toJson(tasks),
  };

  const agents: ExportFile = {
    path: "AGENTS.md",
    content: [
      "# Agents",
      "",
      "- **ada-context-scout** — reads the pack, answers what the domain requires.",
      "- **ada-blueprint-writer** — executes the task graph without over-engineering.",
      "- **ada-c-verifier** — runs the C checks and blocks acceptance on failure.",
      "",
      "Order: scout → blueprint-writer (per task) → c-verifier (gate) → repeat.",
      "",
    ].join("\n"),
  };

  return [context, blueprint, acceptance, gates, verify, taskGraph, agents];
}
