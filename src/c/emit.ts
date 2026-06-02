/** Emits the C subsystem into a pack: runnable checks, fixtures, registry, doc. */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CHECK_FILES, FIXTURES_SOURCE, VERIFY_SOURCE } from "./checkSources.js";
import { toYaml } from "../core/serialize.js";

export async function emitChecks(cChecksDir: string): Promise<void> {
  await mkdir(cChecksDir, { recursive: true });
  for (const f of CHECK_FILES) {
    await writeFile(join(cChecksDir, f.filename), f.source, "utf8");
  }
  await writeFile(join(cChecksDir, "fixtures.mjs"), FIXTURES_SOURCE, "utf8");
  await writeFile(join(cChecksDir, "verify.mjs"), VERIFY_SOURCE, "utf8");
}

export function registryYaml(): string {
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

export function cDoc(): string {
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
