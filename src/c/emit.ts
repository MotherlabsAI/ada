/** Emits the C subsystem into a pack: runnable checks, fixtures, registry, doc. */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CHECK_FILES, FIXTURES_SOURCE, VERIFY_SOURCE } from "./checkSources.js";
import { toYaml } from "../core/serialize.js";
import type { PackModel } from "../core/types.js";

/**
 * AXIOM A2 — a hole beats a lie. The booking SHOWCASE ships a real runnable suite
 * (`verify.mjs` + fixtures) whose checks match its rules. The generic engine cannot
 * yet lower a node's natural-language κ candidate into runnable code, so for any
 * other pack we must NOT emit the booking checks (they belong to a different domain)
 * and must NOT claim a runnable backing. Instead we emit the pack's own κ candidates
 * as honestly-labelled invariants the executor must implement.
 */

/** Deterministic (C3–C5) nodes carry κ candidate assertions; collect them. */
function candidateChecks(model: PackModel) {
  const rows: {
    name: string;
    node: string;
    checkClass: string;
    invariant: string;
  }[] = [];
  for (const n of model.graph.nodes) {
    const cls = n.checkability?.class;
    if (cls !== "C3" && cls !== "C4" && cls !== "C5") continue;
    for (const cand of n.checkability.candidates ?? []) {
      rows.push({ name: n.id, node: n.id, checkClass: cls, invariant: cand });
    }
  }
  return rows;
}

export async function emitChecks(
  cChecksDir: string,
  shipsRunnableChecks: boolean,
): Promise<void> {
  await mkdir(cChecksDir, { recursive: true });
  if (shipsRunnableChecks) {
    for (const f of CHECK_FILES) {
      await writeFile(join(cChecksDir, f.filename), f.source, "utf8");
    }
    await writeFile(join(cChecksDir, "fixtures.mjs"), FIXTURES_SOURCE, "utf8");
    await writeFile(join(cChecksDir, "verify.mjs"), VERIFY_SOURCE, "utf8");
    return;
  }
  // Candidate mode: no false verify.mjs. Leave a note so the executor knows these
  // are invariants to implement, listed in ../C.md (A2 honesty).
  await writeFile(
    join(cChecksDir, "README.md"),
    [
      "# Candidate checks — implement these",
      "",
      "This pack did not ship runnable C checks. The invariants in `../C.md` are",
      "deterministic candidates (κ) the executor must implement as runnable pass/fail",
      "predicates — no model inside a check (AXIOM A3). The rule's assertion is the test.",
      "",
    ].join("\n"),
    "utf8",
  );
}

export function registryYaml(
  model: PackModel,
  shipsRunnableChecks: boolean,
): string {
  if (shipsRunnableChecks) {
    return toYaml({
      version: "1",
      note: "C is the deterministic trust layer. No model lives inside a check (AXIOM A3).",
      checks: CHECK_FILES.map((f) => ({
        name: f.name,
        invariant: f.invariant,
        checkClass: f.checkClass,
        file: "checks/" + f.filename,
        lineage: f.lineage,
      })),
    });
  }
  const candidates = candidateChecks(model);
  return toYaml({
    version: "1",
    mode: "candidate",
    note:
      "Candidate invariants (κ) derived from this pack's deterministic nodes. The executor " +
      "must implement each as a runnable pass/fail check — no model inside a check (AXIOM A3). " +
      "Not yet shipped as runnable (AXIOM A2: a hole beats a lie).",
    checks: candidates.map((c) => ({
      name: c.name,
      invariant: c.invariant,
      checkClass: c.checkClass,
      node: c.node,
      status: "candidate",
    })),
  });
}

export function cDoc(model: PackModel, shipsRunnableChecks: boolean): string {
  if (shipsRunnableChecks) {
    const rows = CHECK_FILES.map(
      (f) => `| \`${f.name}\` | ${f.checkClass} | ${f.invariant} |`,
    ).join("\n");
    return [
      "# C — Deterministic Verification Layer",
      "",
      "C is the set of executable checks that state what *correct* means for the",
      "checkable parts of this domain. A C check is a runnable pass/fail predicate —",
      "not a prompt, not a model, not subjective judgment (AXIOM A3).",
      "",
      "## Registry",
      "",
      "| check | class | invariant |",
      "|---|---|---|",
      rows,
      "",
      "## Run it",
      "",
      "```bash",
      "# from this pack's c/checks directory:",
      "node verify.mjs            # all checks against the clean dataset (expect all pass)",
      "node verify.mjs --defect   # against a planted double-booking (expect no_double_booking to FAIL)",
      "node verify.mjs --json     # machine-readable report",
      "```",
      "",
      "## How C grows",
      "",
      "A missed failure is the source of new C. When the executor produces output that",
      "current checks pass but is still wrong, that defect is generalized into a new",
      "invariant, scope-critiqued (too narrow / too broad), and added here.",
      "",
    ].join("\n");
  }
  const candidates = candidateChecks(model);
  const rows = candidates.length
    ? candidates
        .map((c) => `| \`${c.node}\` | ${c.checkClass} | ${c.invariant} |`)
        .join("\n")
    : "| — | — | (no deterministic κ candidates surfaced in this pack) |";
  return [
    "# C — Deterministic Verification Layer (candidate invariants)",
    "",
    "These are the deterministic invariants (κ) this pack excavated. They are NOT yet",
    "shipped as runnable checks — the executor MUST implement each as a runnable pass/fail",
    "predicate with no model inside it (AXIOM A3). A hole is better than a lie (AXIOM A2):",
    "this pack claims no runnable backing it does not ship.",
    "",
    "## Candidate invariants (implement each)",
    "",
    "| node | class | invariant (the assertion is the acceptance test) |",
    "|---|---|---|",
    rows,
    "",
    "## How to discharge a candidate",
    "",
    "Write a deterministic check (`c/checks/<name>.mjs`) that asserts the invariant on real",
    "data, exit non-zero on violation. Once every candidate has a passing runnable check, the",
    "pack's MUST rules are truly backed — flip the pack to runnable and the executor export",
    "will claim it (enforced by `coherence.ts`).",
    "",
  ].join("\n");
}
