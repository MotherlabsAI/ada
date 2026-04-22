import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { glyphs } from "../ui/design-system.js";
import {
  readCosts,
  summarizeCosts,
  type CostRecord,
  type CostSummary,
} from "../cost.js";

interface Flags {
  readonly json: boolean;
  readonly runId: string | null;
}

function parseFlags(argv: string[]): Flags {
  let json = false;
  let runId: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    if (arg === "--json") {
      json = true;
    } else if (arg === "--run") {
      const next = argv[i + 1];
      if (next !== undefined) {
        runId = next;
        i++;
      }
    } else if (arg.startsWith("--run=")) {
      runId = arg.slice("--run=".length);
    }
  }
  return { json, runId };
}

function formatUSD(usd: number): string {
  if (usd === 0) return "$0.0000";
  if (usd < 0.01) return `$${usd.toFixed(6)}`;
  if (usd < 1) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatAbsolute(ms: number): string {
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

function printSummary(
  summary: CostSummary,
  scope: string,
  showByStage: boolean,
): void {
  console.log("");
  console.log(`  ${glyphs.chevron} cost summary (${scope})`);
  console.log(`      runs:        ${summary.runs}`);
  console.log(`      tokens in:   ${formatTokens(summary.tokensIn)}`);
  console.log(`      tokens out:  ${formatTokens(summary.tokensOut)}`);
  console.log(`      total USD:   ${formatUSD(summary.totalUSD)}`);

  if (showByStage) {
    const stages = Object.keys(summary.byStage).sort();
    if (stages.length > 0) {
      console.log("");
      console.log(`  ${glyphs.chevron} by stage`);
      for (const stage of stages) {
        const b = summary.byStage[stage];
        if (b === undefined) continue;
        const inStr = formatTokens(b.tokensIn).padStart(8);
        const outStr = formatTokens(b.tokensOut).padStart(8);
        const usdStr = formatUSD(b.usd).padStart(10);
        console.log(
          `      ${stage.padEnd(5)}  in ${inStr}   out ${outStr}   ${usdStr}`,
        );
      }
    }
  }
}

function printRecentLines(records: CostRecord[]): void {
  if (records.length === 0) return;
  console.log("");
  console.log(`  ${glyphs.chevron} recent (${records.length})`);
  for (const rec of records) {
    const when = formatAbsolute(rec.ts);
    const runShort = truncate(rec.runId, 16).padEnd(16);
    const stage = rec.stage.padEnd(5);
    const model = truncate(rec.model, 26).padEnd(26);
    const inStr = formatTokens(rec.inputTokens).padStart(7);
    const outStr = formatTokens(rec.outputTokens).padStart(7);
    const usdStr = formatUSD(rec.estimatedUSD).padStart(10);
    console.log(
      `      ${when}  ${runShort}  ${stage}  ${model}  in ${inStr}  out ${outStr}  ${usdStr}`,
    );
  }
}

export async function costCommand(argv: string[]): Promise<void> {
  const flags = parseFlags(argv);
  const usagePath = path.join(os.homedir(), ".ada", "usage.jsonl");

  if (!fs.existsSync(usagePath)) {
    if (flags.json) {
      const empty: CostSummary = {
        runs: 0,
        tokensIn: 0,
        tokensOut: 0,
        totalUSD: 0,
        byStage: {},
      };
      console.log(JSON.stringify(empty, null, 2));
      return;
    }
    console.log(
      "no cost records yet — run `ada compile` or `ada init` first",
    );
    return;
  }

  const summary = summarizeCosts(flags.runId ?? undefined);

  if (flags.json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (flags.runId !== null) {
    printSummary(summary, `run ${flags.runId}`, true);
    console.log("");
    return;
  }

  printSummary(summary, "all runs", false);
  const recent = readCosts(10);
  printRecentLines(recent);
  console.log("");
}
