// `ada context` — long-running context daemon.
//
// Within ~200 ms of invocation:
//   1. Ensures `.ada/` exists in CWD.
//   2. Runs the CTX stage (pure local static analysis — no LLM) via
//      `analyzeCodebase` from `@ada/compiler`, writing a partial state.json
//      populated with just the CTX slice.
//   3. Mounts a live TUI showing pipeline progress.
//   4. If an `intent` was provided, kicks off the full 7-stage compile in
//      the background via `runCompileInBackground(...)`. Each stage merges
//      into state.json as it completes.
//
// The daemon does NOT run an MCP server itself. Claude Code's settings
// spawn `ada mcp` as a child process per session; that child reads
// state.json fresh on every query (see cli/src/commands/mcp.ts). So this
// daemon is a *state populator*; the `ada mcp` child is the *state reader*.
//
// Never blocks. If a stage LLM call hangs or fails, the daemon stays
// alive and state.json keeps serving whatever's in the store.

import * as fs from "node:fs";
import * as path from "node:path";
import { analyzeCodebase } from "@ada/compiler";
import { StateStore } from "../state-store.js";
import { runCompileInBackground } from "../compile-runner.js";
import { onCancel } from "../signal.js";
import { glyphs, formatElapsed } from "../ui/design-system.js";
import { mountContextPanel } from "../ui/context-panel.js";

export interface ContextOptions {
  readonly intent?: string;
  readonly verbose?: boolean;
}

const FALLBACK_TICK_MS = 2000;

function ensureAdaDir(cwd: string): string {
  const dir = path.join(cwd, ".ada");
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[ada context] could not create .ada/: ${msg}\n`);
  }
  return dir;
}

function seedCtxStage(store: StateStore, verbose: boolean): void {
  const cwd = process.cwd();
  try {
    const ctx = analyzeCodebase(cwd);
    const contentScore = ctx.vocabulary.length + ctx.constants.length;
    store.mergeStage("CTX", {
      status: "complete",
      data: {
        postcode: ctx.postcode,
        typeRegistry: ctx.typeRegistry,
        vocabulary: ctx.vocabulary,
        constants: ctx.constants,
        packageBoundaries: ctx.packageBoundaries,
      },
      completedAt: Date.now(),
      entropy: contentScore,
    });
    if (verbose) {
      process.stderr.write(
        `  ${glyphs.chevron} CTX seeded (${ctx.vocabulary.length} vocab, ${ctx.typeRegistry.length} types)\n`,
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[ada context] CTX stage failed: ${msg}\n`);
    store.mergeStage("CTX", {
      status: "failed",
      data: { error: msg },
      completedAt: Date.now(),
    });
  }
}

function startFallbackRenderer(
  store: StateStore,
  compileRunning: () => boolean,
  startedAt: number,
): () => void {
  const tick = (): void => {
    const snap = store.getLatest();
    const stages = Object.values(snap.stages);
    const complete = stages.filter((s) => s?.status === "complete").length;
    const running = stages.find((s) => s?.status === "running")?.stage ?? "—";
    const uptime = formatElapsed(Date.now() - startedAt);
    const compileTag = compileRunning() ? "compiling" : "idle";
    process.stderr.write(
      `  ${glyphs.chevron} ada context  stages:${complete}/8  current:${running}  ${compileTag}  up:${uptime}\n`,
    );
  };
  tick();
  const handle = setInterval(tick, FALLBACK_TICK_MS);
  if (typeof handle.unref === "function") handle.unref();
  return () => clearInterval(handle);
}

export async function contextCommand(
  intent: string | undefined,
  options: ContextOptions,
): Promise<void> {
  const startedAt = Date.now();
  const verbose = options.verbose === true;
  const cwd = process.cwd();

  ensureAdaDir(cwd);

  // Load any existing state first (honour --amend-like semantics), then
  // seed a fresh CTX slice. If no previous run exists, load() returns a
  // fresh snapshot anyway.
  const store = new StateStore(cwd);
  store.load();
  if (intent && !store.getLatest().intent) {
    store.startRun(intent);
  }
  seedCtxStage(store, verbose);

  // Give the user an immediate printable signal that the daemon is up
  // and the minimum viable context (CTX only) is available.
  process.stderr.write(
    `  ${glyphs.status.pass} ada context serving .ada/state.json in ${cwd}\n` +
      `  ${glyphs.chevron} Claude Code can now connect via MCP (run \`claude\` in another terminal in this dir).\n`,
  );

  let compileRunning = false;

  // ── TUI ──
  // Mount the Ink panel when stderr is a TTY. Pipes/captured outputs get
  // the plain-text ticker so we don't corrupt the stream.
  const stderrIsTty =
    typeof process.stderr.isTTY === "boolean" ? process.stderr.isTTY : false;

  let stopPanel: (() => void) | null = null;
  let stopFallback: (() => void) | null = null;

  if (stderrIsTty) {
    try {
      stopPanel = mountContextPanel(() => ({
        snapshot: store.getLatest(),
        mcpStatus: "running",
        lastQueryAt: null,
        compileRunning,
        startedAt,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(
        `[ada context] Ink panel unavailable (${msg}); falling back to text\n`,
      );
      stopFallback = startFallbackRenderer(
        store,
        () => compileRunning,
        startedAt,
      );
    }
  } else {
    process.stderr.write(
      `  ${glyphs.chevron} ada context started (non-tty); stages update silently in .ada/state.json\n`,
    );
  }

  // ── Signal handler ──
  onCancel(async () => {
    try {
      store.save(store.getLatest());
    } catch {
      /* state save is best-effort on shutdown */
    }
    if (stopPanel) stopPanel();
    if (stopFallback) stopFallback();
    process.stderr.write(
      `\n  ${glyphs.status.stopped} ada context stopped (${formatElapsed(Date.now() - startedAt)})\n`,
    );
  });

  // ── Background compile ──
  if (intent && intent.trim().length > 0) {
    compileRunning = true;
    const handle = runCompileInBackground(intent, store, {
      onStageStart: (stage) => {
        if (verbose) {
          process.stderr.write(`  ${glyphs.pipeline.arrow} ${stage}\n`);
        }
      },
      onError: (err) => {
        process.stderr.write(
          `[ada context] compile error (daemon stays alive): ${err.message}\n`,
        );
      },
      onDone: (decision) => {
        compileRunning = false;
        if (verbose) {
          process.stderr.write(
            `  ${glyphs.chevron} compile done: ${decision}\n`,
          );
        }
      },
    });
    handle.promise.catch(() => {
      compileRunning = false;
    });
  }

  // Never resolve. The daemon's lifetime is the process lifetime;
  // signal handlers do the exit.
  await new Promise<void>(() => {
    /* intentionally unresolved */
  });
}
