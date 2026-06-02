/** Runs a pack's own verify.mjs and renders the report (AXIOM A5: dogfood the artifact). */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { paint, bold, dim } from "../core/grammar.js";

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
