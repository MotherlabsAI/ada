/** Runs a pack's own verify.mjs and renders the report (AXIOM A5: dogfood the artifact). */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { paint, bold, dim } from "../core/grammar.js";
import { densityVerdict } from "../export/salience.js";

export interface CheckResult {
  name: string;
  pass: boolean;
  violations: unknown[];
  invariant: string;
  checkClass: string;
}

export interface CReport {
  fixture: string;
  total: number;
  passed: number;
  failed: number;
  results: CheckResult[];
}

export function runChecks(
  packRoot: string,
  opts: { defect?: boolean } = {},
): CReport {
  const verify = join(packRoot, "c", "checks", "verify.mjs");
  if (!existsSync(verify)) {
    throw new Error(
      `No verify harness at ${verify}. Run \`ada compile\` first.`,
    );
  }
  const args = [verify, "--json"];
  if (opts.defect) args.push("--defect");
  // verify.mjs exits non-zero when a check fails; that is data, not an error.
  const res = spawnSync(process.execPath, args, { encoding: "utf8" });
  if (res.error) throw res.error;
  const out = (res.stdout || "").trim();
  if (!out) {
    throw new Error(
      `verify.mjs produced no output.\n${res.stderr || "(no stderr)"}`,
    );
  }
  try {
    return JSON.parse(out) as CReport;
  } catch (e) {
    throw new Error(
      `verify.mjs output was not valid JSON (exit ${res.status}).\n` +
        `stdout: ${out.slice(0, 500)}\nstderr: ${res.stderr || "(none)"}\nparse error: ${String(e)}`,
    );
  }
}

/**
 * The salience-budget density gate (FREEZE.md §4, 4-a; AXIOM A3). PURE + MODEL-FREE: it
 * reads the emitted CLAUDE.md off disk and runs the deterministic `densityVerdict`
 * predicate (no LLM, no network, identical input → identical verdict). An over-budget
 * pack FAILS here, exactly as the freeze requires ("an over-budget pack FAILS `ada c run`
 * on a pure predicate"). Returns a CheckResult so it slots into the same report as the
 * data-fixture checks. Returns null when there is no emitted CLAUDE.md to gate.
 */
export function densityCheck(packRoot: string): CheckResult | null {
  const claudeMd = join(packRoot, "exports", "claude", "CLAUDE.md");
  if (!existsSync(claudeMd)) return null;
  const v = densityVerdict(readFileSync(claudeMd, "utf8"));
  return {
    name: "claude_md_within_salience_budget",
    pass: v.pass,
    violations: v.violations,
    invariant: `CLAUDE.md ≤ ${v.byteBudget} bytes and ≤ ${v.ruleBudget} inlined MUST rules (provisional budget; ${v.bytes} bytes / ${v.rules} rules emitted).`,
    checkClass: "C5",
  };
}

/**
 * Runs the data-fixture checks AND the model-free density gate, folded into one report.
 * The CLI uses this so `ada c run` fails an over-budget pack on a pure predicate.
 */
export function runChecksWithDensity(
  packRoot: string,
  opts: { defect?: boolean } = {},
): CReport {
  const base = runChecks(packRoot, opts);
  const density = densityCheck(packRoot);
  if (!density) return base;
  const results = [...base.results, density];
  const passed = results.filter((r) => r.pass).length;
  return {
    fixture: base.fixture,
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
  };
}

export function renderReport(report: CReport): string {
  const lines: string[] = [];
  lines.push(bold("κ C run") + dim(`  ·  fixture: ${report.fixture}`));
  lines.push("");
  for (const r of report.results) {
    const tag = r.pass ? paint("✓ PASS", "green") : paint("↯ FAIL", "rose");
    lines.push(`  ${tag}  ${dim("[" + r.checkClass + "]")} ${r.name}`);
    lines.push(`         ${dim(r.invariant)}`);
    if (!r.pass) {
      for (const v of r.violations) {
        lines.push("         " + paint("↳ " + JSON.stringify(v), "rose"));
      }
    }
  }
  lines.push("");
  const summary = `${report.passed}/${report.total} passed`;
  lines.push(
    report.failed > 0
      ? paint(summary + `  ·  ${report.failed} caught`, "amber")
      : paint(summary, "green"),
  );
  return lines.join("\n");
}
