// ═══════════════════════════════════════════════════════════════════════════════
// ADA — Cost Tracking
// Append-only JSONL log of per-stage LLM cost. Read/aggregate helpers included.
// Must never throw on write — cost tracking must not crash a compile.
// ═══════════════════════════════════════════════════════════════════════════════

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export interface CostRecord {
  readonly ts: number; // epoch ms
  readonly runId: string;
  readonly stage: string; // 'INT', 'PER', ...
  readonly model: string; // e.g. 'claude-sonnet-4-6'
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly estimatedUSD: number;
}

export interface CostSummary {
  runs: number;
  tokensIn: number;
  tokensOut: number;
  totalUSD: number;
  byStage: Record<string, { tokensIn: number; tokensOut: number; usd: number }>;
}

// Per-million-token pricing in USD (input, output).
interface ModelPrice {
  readonly input: number;
  readonly output: number;
}

const PRICING: Readonly<Record<string, ModelPrice>> = {
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-opus-4-7": { input: 15, output: 75 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4 },
};

const FALLBACK_MODEL = "claude-sonnet-4-6";

function usageDir(): string {
  return path.join(os.homedir(), ".ada");
}

function usagePath(): string {
  return path.join(usageDir(), "usage.jsonl");
}

/**
 * Estimate USD given a model id + token counts.
 * Table-driven. Unknown models fall back to sonnet rates.
 */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const price = PRICING[model] ?? PRICING[FALLBACK_MODEL];
  if (price === undefined) return 0;
  const inUsd = (inputTokens / 1_000_000) * price.input;
  const outUsd = (outputTokens / 1_000_000) * price.output;
  return inUsd + outUsd;
}

/**
 * Appends one line of JSON to ~/.ada/usage.jsonl (creates dirs if needed).
 * Never throws — cost tracking must not crash a compile.
 */
export function recordCost(record: CostRecord): void {
  try {
    const dir = usageDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const line = JSON.stringify(record) + "\n";
    fs.appendFileSync(usagePath(), line, { encoding: "utf8" });
  } catch {
    // Swallow — cost tracking is best-effort.
  }
}

function parseLine(line: string): CostRecord | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) return null;
  try {
    const obj = JSON.parse(trimmed) as Partial<CostRecord>;
    if (
      typeof obj.ts !== "number" ||
      typeof obj.runId !== "string" ||
      typeof obj.stage !== "string" ||
      typeof obj.model !== "string" ||
      typeof obj.inputTokens !== "number" ||
      typeof obj.outputTokens !== "number" ||
      typeof obj.estimatedUSD !== "number"
    ) {
      return null;
    }
    return {
      ts: obj.ts,
      runId: obj.runId,
      stage: obj.stage,
      model: obj.model,
      inputTokens: obj.inputTokens,
      outputTokens: obj.outputTokens,
      estimatedUSD: obj.estimatedUSD,
    };
  } catch {
    return null;
  }
}

function readAllRecords(): CostRecord[] {
  const p = usagePath();
  if (!fs.existsSync(p)) return [];
  let content: string;
  try {
    content = fs.readFileSync(p, "utf8");
  } catch {
    return [];
  }
  const lines = content.split("\n");
  const out: CostRecord[] = [];
  for (const line of lines) {
    const rec = parseLine(line);
    if (rec !== null) out.push(rec);
  }
  return out;
}

/**
 * Read + return all records (up to `limit`, most recent first).
 */
export function readCosts(limit?: number): CostRecord[] {
  const all = readAllRecords();
  all.sort((a, b) => b.ts - a.ts);
  if (limit !== undefined && limit >= 0) {
    return all.slice(0, limit);
  }
  return all;
}

/**
 * Aggregate totals across all records or optionally filtered to `runId`.
 */
export function summarizeCosts(runId?: string): CostSummary {
  const all = readAllRecords();
  const filtered =
    runId !== undefined ? all.filter((r) => r.runId === runId) : all;

  const runIds = new Set<string>();
  let tokensIn = 0;
  let tokensOut = 0;
  let totalUSD = 0;
  const byStage: Record<
    string,
    { tokensIn: number; tokensOut: number; usd: number }
  > = {};

  for (const rec of filtered) {
    runIds.add(rec.runId);
    tokensIn += rec.inputTokens;
    tokensOut += rec.outputTokens;
    totalUSD += rec.estimatedUSD;
    const bucket = byStage[rec.stage] ?? {
      tokensIn: 0,
      tokensOut: 0,
      usd: 0,
    };
    bucket.tokensIn += rec.inputTokens;
    bucket.tokensOut += rec.outputTokens;
    bucket.usd += rec.estimatedUSD;
    byStage[rec.stage] = bucket;
  }

  return {
    runs: runIds.size,
    tokensIn,
    tokensOut,
    totalUSD,
    byStage,
  };
}
