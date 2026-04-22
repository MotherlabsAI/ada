#!/usr/bin/env node
/**
 * ada benchmark harness
 *
 * Measures user-felt latencies for ada's CLI without any external deps.
 * Run via: pnpm tsx scripts/benchmark.ts
 *   or:    node --import tsx scripts/benchmark.ts
 *
 * Reports cold-start timings for `--help` and `--version`, plus per-command
 * dynamic `import()` time (spawned fresh each run to defeat the ESM cache).
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

// ─── paths ──────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const CLI_ENTRY = resolve(REPO_ROOT, 'cli/dist/index.js');
const COMMANDS_DIR = resolve(REPO_ROOT, 'cli/dist/commands');

const COMMAND_MODULES = [
  'init', 'compile', 'run', 'resume', 'verify',
  'mcp', 'config', 'status', 'history', 'list',
  'clean', 'doctor', 'explain', 'export', 'which',
];

const ITERATIONS = 10;

// ─── stats helpers ──────────────────────────────────────────────────────────
interface Stats { min: number; median: number; p95: number; max: number; mean: number; }

function stats(samples: number[]): Stats {
  const sorted = [...samples].sort((a, b) => a - b);
  const n = sorted.length;
  const pct = (p: number): number => {
    if (n === 0) return 0;
    const idx = Math.min(n - 1, Math.floor(p * (n - 1)));
    return sorted[idx];
  };
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    min: sorted[0] ?? 0,
    median: pct(0.5),
    p95: pct(0.95),
    max: sorted[n - 1] ?? 0,
    mean: n ? sum / n : 0,
  };
}

function fmt(ms: number): string {
  return ms.toFixed(1).padStart(7);
}

// ─── measurement primitives ─────────────────────────────────────────────────
/**
 * Spawn a Node subprocess and time wall-clock duration from spawn to exit.
 * Subprocess is the only reliable way to get cold-start timings (ESM cache
 * is per-process).
 */
function timeSpawn(args: string[], cwd = REPO_ROOT): number {
  const start = performance.now();
  const result = spawnSync(process.execPath, args, {
    cwd,
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  const end = performance.now();
  if (result.error) {
    console.error(`  spawn failed: ${result.error.message}`);
    return NaN;
  }
  return end - start;
}

function runSamples(label: string, args: string[]): Stats {
  const samples: number[] = [];
  process.stdout.write(`  ${label} `);
  for (let i = 0; i < ITERATIONS; i++) {
    const t = timeSpawn(args);
    if (!Number.isNaN(t)) samples.push(t);
    process.stdout.write('.');
  }
  process.stdout.write('\n');
  return stats(samples);
}

/**
 * Measure dynamic import() time for a single module inside a fresh Node
 * subprocess. Uses `node -e` with inline JS that imports and prints the ms.
 */
function timeImport(modulePath: string): number {
  // We print the elapsed ms to stdout and parse it.
  const script = `
    const { performance } = require('node:perf_hooks');
    const start = performance.now();
    import(${JSON.stringify(modulePath)}).then(() => {
      const elapsed = performance.now() - start;
      process.stdout.write(String(elapsed));
    }).catch((err) => {
      process.stderr.write('IMPORT_ERR: ' + err.message);
      process.exit(2);
    });
  `;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) return NaN;
  const parsed = parseFloat(result.stdout.toString().trim());
  return Number.isFinite(parsed) ? parsed : NaN;
}

// ─── reporting ──────────────────────────────────────────────────────────────
function printStatsTable(rows: Array<{ name: string; s: Stats }>): void {
  console.log('');
  console.log('| benchmark           |     min |  median |     p95 |     max |    mean |');
  console.log('|---------------------|---------|---------|---------|---------|---------|');
  for (const { name, s } of rows) {
    console.log(
      `| ${name.padEnd(19)} | ${fmt(s.min)} | ${fmt(s.median)} | ${fmt(s.p95)} | ${fmt(s.max)} | ${fmt(s.mean)} |`,
    );
  }
  console.log('');
}

function printImportTable(rows: Array<{ name: string; ms: number }>): void {
  const sorted = [...rows].sort((a, b) => a.ms - b.ms);
  console.log('');
  console.log('| command module | import ms |');
  console.log('|----------------|-----------|');
  for (const { name, ms } of sorted) {
    const cell = Number.isNaN(ms) ? '    n/a' : fmt(ms);
    console.log(`| ${name.padEnd(14)} | ${cell} |`);
  }
  console.log('');
}

// ─── main ───────────────────────────────────────────────────────────────────
function main(): void {
  console.log('ada benchmark harness');
  console.log(`  node:       ${process.version}`);
  console.log(`  platform:   ${process.platform} ${process.arch}`);
  console.log(`  iterations: ${ITERATIONS}`);
  console.log(`  cli entry:  ${CLI_ENTRY}`);
  console.log('');

  const cliBuilt = existsSync(CLI_ENTRY);
  if (!cliBuilt) {
    console.log('  note: cli/dist/index.js not found — run `pnpm -C cli build` first.');
    console.log('  skipping CLI cold-start measurements.');
  }

  // 1. Node baseline
  console.log('node baseline (node -e "")');
  const baseline = runSamples('node -e ""  ', ['-e', '']);

  // 2. ada --help / --version cold start
  const rows: Array<{ name: string; s: Stats }> = [
    { name: 'node baseline', s: baseline },
  ];

  let helpStats: Stats | null = null;
  if (cliBuilt) {
    console.log('ada --help cold start');
    helpStats = runSamples('ada --help   ', [CLI_ENTRY, '--help']);
    rows.push({ name: 'ada --help', s: helpStats });

    console.log('ada --version cold start');
    const versionStats = runSamples('ada --version', [CLI_ENTRY, '--version']);
    rows.push({ name: 'ada --version', s: versionStats });
  }

  printStatsTable(rows);

  // 3. per-command-module import time
  console.log('per-command-module dynamic import() (fresh subprocess each)');
  const importRows: Array<{ name: string; ms: number }> = [];
  for (const mod of COMMAND_MODULES) {
    const modPath = resolve(COMMANDS_DIR, `${mod}.js`);
    if (!existsSync(modPath)) {
      process.stdout.write(`  ${mod} (missing)\n`);
      importRows.push({ name: mod, ms: NaN });
      continue;
    }
    const ms = timeImport(modPath);
    process.stdout.write(`  ${mod.padEnd(8)} ${Number.isNaN(ms) ? 'n/a' : fmt(ms) + ' ms'}\n`);
    importRows.push({ name: mod, ms });
  }
  printImportTable(importRows);

  // 4. summary line
  if (helpStats && baseline.median > 0) {
    const ratio = helpStats.median / baseline.median;
    console.log(
      `cold-start median: ${helpStats.median.toFixed(0)}ms ` +
      `(p95: ${helpStats.p95.toFixed(0)}ms) — ${ratio.toFixed(1)}× Node baseline`,
    );
  } else {
    console.log('cold-start summary unavailable (CLI not built).');
  }

  process.exit(0);
}

main();
