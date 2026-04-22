/**
 * End-to-end smoke test for `ada compile`.
 *
 * Runs the locally-built CLI against a simple hello-world intent, writes the
 * blueprint into a tempdir, then validates the output shape. Does NOT spawn
 * Claude Code — uses the API directly via ANTHROPIC_API_KEY.
 *
 * Exit codes:
 *   0 — all checks passed, or ANTHROPIC_API_KEY missing (skip)
 *   1 — compile-time error (CLI returned non-zero while running)
 *   2 — compile succeeded but output validation failed
 *
 * Run:
 *   node --import tsx scripts/e2e.ts
 *   # or compile with tsc and run the .js
 */

import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const CLI_PATH = '/home/motherlabs/mlabs-cog-infra/ada/cli/dist/index.js';
const INTENT = 'a hello-world CLI that prints greetings in multiple languages';
const OUTPUT_NAME = 'blueprint.json';

type CheckResult = { name: string; ok: boolean; detail?: string };

function log(msg: string): void {
  process.stderr.write(`[e2e] ${msg}\n`);
}

function cleanup(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (err) {
    log(`cleanup warning: ${(err as Error).message}`);
  }
}

function runCompile(cwd: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const args = [
      CLI_PATH,
      'compile',
      INTENT,
      '--output',
      OUTPUT_NAME,
      '--strict',
    ];
    log(`spawning: node ${args.join(' ')}`);
    log(`cwd: ${cwd}`);

    const child = spawn(process.execPath, args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'inherit', 'pipe'],
    });

    if (child.stderr) {
      child.stderr.on('data', (chunk: Buffer) => {
        process.stderr.write(chunk);
      });
    }

    child.on('error', (err) => {
      reject(err);
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`CLI killed by signal ${signal}`));
        return;
      }
      resolve(code ?? 0);
    });
  });
}

function check(name: string, ok: boolean, detail?: string): CheckResult {
  return { name, ok, detail };
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function validate(blueprintPath: string): {
  checks: CheckResult[];
  parsed: Record<string, unknown> | null;
} {
  const checks: CheckResult[] = [];
  let parsed: Record<string, unknown> | null = null;

  const exists = fs.existsSync(blueprintPath);
  checks.push(check('blueprint.json exists', exists, blueprintPath));
  if (!exists) return { checks, parsed };

  let raw: string;
  try {
    raw = fs.readFileSync(blueprintPath, 'utf8');
  } catch (err) {
    checks.push(check('blueprint.json readable', false, (err as Error).message));
    return { checks, parsed };
  }
  checks.push(check('blueprint.json readable', true, `${raw.length} bytes`));

  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
    checks.push(check('blueprint.json parses as JSON', true));
  } catch (err) {
    checks.push(
      check('blueprint.json parses as JSON', false, (err as Error).message),
    );
    return { checks, parsed };
  }

  const bp = parsed.blueprint as Record<string, unknown> | undefined;
  const summary = bp && (bp as Record<string, unknown>).summary;
  checks.push(
    check(
      '.blueprint.summary is non-empty string',
      isNonEmptyString(summary),
      isNonEmptyString(summary) ? `"${summary.slice(0, 60)}..."` : String(summary),
    ),
  );

  const gd = parsed.governorDecision as Record<string, unknown> | undefined;
  const decision = gd && (gd as Record<string, unknown>).decision;
  checks.push(
    check(
      '.governorDecision.decision === "ACCEPT"',
      decision === 'ACCEPT',
      String(decision),
    ),
  );

  const ps = parsed.pipelineState as Record<string, unknown> | undefined;
  const intent = ps && (ps as Record<string, unknown>).intent;
  const goals =
    intent && (intent as Record<string, unknown>).goals;
  const goalsOk = Array.isArray(goals) && goals.length >= 1;
  checks.push(
    check(
      '.pipelineState.intent.goals is array (>=1)',
      goalsOk,
      Array.isArray(goals) ? `len=${goals.length}` : typeof goals,
    ),
  );

  const cr = parsed.compilationRun as Record<string, unknown> | undefined;
  const stages = cr && (cr as Record<string, unknown>).stages;
  const stagesOk = Array.isArray(stages) && stages.length >= 7;
  checks.push(
    check(
      '.compilationRun.stages is array (>=7)',
      stagesOk,
      Array.isArray(stages) ? `len=${stages.length}` : typeof stages,
    ),
  );

  return { checks, parsed };
}

function countArrayField(
  parsed: Record<string, unknown> | null,
  section: string,
  field: string,
): number | string {
  if (!parsed) return '-';
  const ps = parsed.pipelineState as Record<string, unknown> | undefined;
  if (!ps) return '-';
  const s = ps[section] as Record<string, unknown> | undefined;
  if (!s) return '-';
  const arr = s[field];
  return Array.isArray(arr) ? arr.length : '-';
}

function printSummary(
  parsed: Record<string, unknown> | null,
  elapsedMs: number,
  allGreen: boolean,
): void {
  const gd = parsed?.governorDecision as Record<string, unknown> | undefined;
  const decision = (gd?.decision as string) ?? 'UNKNOWN';

  const goals = countArrayField(parsed, 'intent', 'goals');
  const entities = countArrayField(parsed, 'entities', 'entities');
  const workflows = countArrayField(parsed, 'workflows', 'workflows');
  const components = countArrayField(parsed, 'components', 'components');

  const rows: Array<[string, string]> = [
    ['Status', allGreen ? 'PASS' : 'FAIL'],
    ['Decision', decision],
    ['Goals', String(goals)],
    ['Entities', String(entities)],
    ['Workflows', String(workflows)],
    ['Components', String(components)],
    ['Elapsed', `${(elapsedMs / 1000).toFixed(1)}s`],
  ];

  const keyW = Math.max(...rows.map((r) => r[0].length));
  const valW = Math.max(...rows.map((r) => r[1].length));

  const out: string[] = [];
  out.push(`| ${'Field'.padEnd(keyW)} | ${'Value'.padEnd(valW)} |`);
  out.push(`|${'-'.repeat(keyW + 2)}|${'-'.repeat(valW + 2)}|`);
  for (const [k, v] of rows) {
    out.push(`| ${k.padEnd(keyW)} | ${v.padEnd(valW)} |`);
  }
  process.stdout.write(out.join('\n') + '\n');
}

function main(): void {
  if (!process.env.ANTHROPIC_API_KEY) {
    process.stdout.write('SKIP: ANTHROPIC_API_KEY not set\n');
    process.exit(0);
    return;
  }

  if (!fs.existsSync(CLI_PATH)) {
    log(`ERROR: CLI not found at ${CLI_PATH}`);
    log('Run `pnpm -C cli build` (or equivalent) first.');
    process.exit(1);
    return;
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ada-e2e-'));
  log(`tempdir: ${tmp}`);

  let exitCode = 0;
  const started = Date.now();

  const done = (code: number): void => {
    cleanup(tmp);
    process.exit(code);
  };

  const onUncaught = (err: Error): void => {
    log(`uncaught: ${err.message}`);
    cleanup(tmp);
    process.exit(1);
  };
  process.on('uncaughtException', onUncaught);
  process.on('unhandledRejection', onUncaught as (reason: unknown) => void);

  runCompile(tmp)
    .then((compileExit) => {
      const elapsed = Date.now() - started;
      if (compileExit !== 0) {
        log(`compile failed with exit code ${compileExit}`);
        exitCode = 1;
        done(exitCode);
        return;
      }
      log(`compile succeeded in ${(elapsed / 1000).toFixed(1)}s`);

      const blueprintPath = path.join(tmp, OUTPUT_NAME);
      const { checks, parsed } = validate(blueprintPath);

      let allGreen = true;
      for (const c of checks) {
        const mark = c.ok ? 'OK  ' : 'FAIL';
        log(`${mark} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
        if (!c.ok) allGreen = false;
      }

      printSummary(parsed, elapsed, allGreen);

      exitCode = allGreen ? 0 : 2;
      done(exitCode);
    })
    .catch((err: Error) => {
      log(`compile error: ${err.message}`);
      exitCode = 1;
      done(exitCode);
    });
}

main();
