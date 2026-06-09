#!/usr/bin/env node
/**
 * ada — semantic context compiler CLI.
 *
 * Commands (P0, AXIOM A7):
 *   ada init                         scaffold .ada/ in the current directory
 *   ada compile "<intent>" [--slug]  compile intent into a pack
 *   ada open [slug] [nodeId]         navigate the pack (interactive in a TTY)
 *   ada tui [slug]                   launch the Ink workbench (TTY) — sister to Claude Code
 *   ada deeper <slug> <nodeId>       expand a node into its full wiki article
 *   ada flag <slug> <nodeId>         flag a node for inclusion
 *   ada resume [slug]                show flagged / last-opened state
 *   ada c run [slug] [--defect]      run the pack's deterministic C checks
 *   ada export [slug]                list the exported Claude + blueprint files
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { buildShowcasePack } from "./compile/showcase.js";
import {
  DEFAULT_PROPOSED_CLUSTERS,
  type ClusterDef,
} from "./compile/engine/clusters.js";
import {
  engineCompile,
  withAnchors as withAnchorsShared,
} from "./compile/engine/compile.js";
import { engineSeed } from "./compile/engine/seed.js";
import { expandNode, canExpand } from "./compile/engine/expand.js";
import { ingestRepo } from "./compile/engine/ingest.js";
import { repoDigest } from "./compile/engine/repoDigest.js";
import {
  defaultModelClient,
  claudeCodeAvailable,
  resolveProvider,
} from "./compile/engine/model.js";
import {
  nextStep,
  applyAnswer,
  MAX_TURNS,
  type InterviewStep,
  type InterviewTurn,
} from "./compile/engine/interview.js";
import { writePack } from "./pack/writer.js";
import { projectPOM } from "./export/pom.js";
import { paths, packsRoot, nodeDir } from "./pack/layout.js";
import { nodeWiki } from "./pack/wiki.js";
import {
  loadPack,
  renderStatic,
  interactive,
  flagNode,
  resume,
} from "./tui/navigator.js";
import { runChecksWithDensity, renderReport } from "./c/run.js";
import { canRunInk } from "./tui/ink/canRunInk.js";
import { readSnapshot, renderSnapshot } from "./tui/watch.js";
import { restoreTerminal, armTerminalRestore } from "./tui/terminal.js";
import { paint, bold, dim } from "./core/grammar.js";
import { loadEnvConfig } from "./env.js";
import type { Seed } from "./core/types.js";

const cwd = process.cwd();

function parseFlags(args: string[]): {
  positional: string[];
  flags: Record<string, string | boolean>;
} {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (const a of args) {
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      flags[k!] = v ?? true;
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

/**
 * Cost-control options for the engine compile path. Threaded into `excavatePack`
 * (`perCluster` caps nodes/cluster → caps model calls) and `anthropicClient` (`model`).
 * Kept as a separate pure shape so the flag→options mapping is testable without a live call.
 */
export interface EngineOptions {
  /** Target kept nodes per cluster; undefined → engine default. Always a positive integer. */
  perCluster?: number;
  /** Model id override; undefined → anthropicClient falls back to ADA_MODEL, then default. */
  model?: string;
  /**
   * Explicit area override from `--clusters=A,B,C` (P7). When present it SKIPS the
   * model-driven proposal step and uses these codes directly (ROOT+UNK are still ensured by
   * `withAnchors`). Each becomes `{ code, label: code }` — a human label is unavailable for a
   * bare code, so the code doubles as its label. Undefined → propose from the intent.
   */
  clusters?: ClusterDef[];
  /**
   * `--repo[=path]` → repo-aware compile (spine step 1). Path to an existing repo whose
   * compiled digest is fed to the excavator as ∵ source. Bare `--repo` means the cwd (".").
   */
  repo?: string;
  /**
   * `--provider=claude-code|api` → force the model provider. `claude-code` borrows the local
   * `claude` CLI on the user's subscription (NO API key); `api` uses ANTHROPIC_API_KEY directly.
   * Undefined → auto (prefers the subscription when `claude` is on PATH). `--claude-code` is sugar.
   */
  provider?: string;
}

/**
 * Pure flag→options mapping for `ada compile --engine`. No model call, no I/O — so it can be
 * asserted directly in tests.
 *   --depth=N    → { perCluster: N }, only when N parses to a positive integer; junk ignored.
 *   --model=<id> → { model: <id> }, only when a non-empty string; bare `--model` is ignored.
 * Precedence for the model is enforced downstream (flag > ADA_MODEL env > built-in default):
 * we only emit `model` when the flag carries a real value, leaving the env/default path intact.
 */
export function buildEngineOptions(
  flags: Record<string, string | boolean>,
): EngineOptions {
  const opts: EngineOptions = {};
  const depthRaw = flags["depth"];
  if (typeof depthRaw === "string") {
    const trimmed = depthRaw.trim();
    // Positive integer only (no leading zeros, no sign, no decimals, no junk).
    if (/^[1-9][0-9]*$/.test(trimmed)) {
      opts.perCluster = Number(trimmed);
    }
  }
  const modelRaw = flags["model"];
  if (typeof modelRaw === "string" && modelRaw.trim()) {
    opts.model = modelRaw.trim();
  }
  // --clusters=A,B,C → explicit area codes (skips the model proposal). Each code is
  // sanitized to a short UPPERCASE token; ROOT/UNK are dropped here (the anchors are added
  // downstream) and the result is deduped. Junk / empty → ignored, leaving the proposal path.
  const clustersRaw = flags["clusters"];
  if (typeof clustersRaw === "string" && clustersRaw.trim()) {
    const seen = new Set<string>(["ROOT", "UNK"]);
    const defs: ClusterDef[] = [];
    for (const part of clustersRaw.split(",")) {
      const code = part
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
      const m = /^[A-Z][A-Z0-9]*/.exec(code);
      const clean = m ? m[0].slice(0, 12) : "";
      if (!clean || seen.has(clean)) continue;
      seen.add(clean);
      defs.push({ code: clean, label: clean });
    }
    if (defs.length) opts.clusters = defs;
  }
  // --repo[=path] → repo-aware compile. A string value is the path; bare `--repo` (boolean
  // true) defaults to "." (the cwd). The ingest itself is I/O and happens downstream, not here.
  const repoRaw = flags["repo"];
  if (typeof repoRaw === "string") opts.repo = repoRaw.trim() || ".";
  else if (repoRaw === true) opts.repo = ".";
  // --provider=claude-code|api (or the sugar --claude-code) → force the model provider. Only the
  // two known values are honored; anything else is ignored, leaving the auto-resolution path.
  const providerRaw = flags["provider"];
  if (typeof providerRaw === "string") {
    const p = providerRaw.trim().toLowerCase();
    if (p === "claude-code" || p === "api") opts.provider = p;
  }
  if (flags["claude-code"] === true) opts.provider = "claude-code";
  return opts;
}

const HELP = [
  bold("ada") + dim(" — semantic context compiler (Ada by Motherlabs)"),
  "",
  "  ada                               open the workbench (TTY) — the default slug's tree",
  "  ada init                          scaffold .ada/ here",
  '  ada compile "<intent>" [--slug=x] compile intent into a pack',
  '  ada compile --engine "<intent>" [--depth=N] [--model=<id>] [--clusters=A,B,C] [--repo[=path]] [--provider=…]',
  "                                    compile via the U2F engine (real model call);",
  "                                    --depth caps nodes/cluster (cost), --model picks the model,",
  "                                    --clusters overrides the auto-derived domain areas,",
  "                                    --repo compiles an existing repo as ∵ source context,",
  "                                    --provider=claude-code uses your Claude Code subscription",
  "                                      (NO API key); =api forces the key. Default: auto.",
  "  ada ctx init [intent] [--slug=x] [--model=id] [--compile]",
  "                                    chat-style interview BEFORE compile: captures what you",
  "                                    expect into the Seed, then exits (--compile chains in)",
  "  ada open [slug] [nodeId]          navigate the pack",
  "  ada tui [slug]                    launch the Ink workbench (TTY)",
  "  ada deeper <slug> <nodeId>        full wiki article for a node",
  "  ada expand <slug> <nodeId>        fractal descent — compile a node into its own sub-tree (travel the language)",
  "  ada flag <slug> <nodeId>          flag a node",
  "  ada resume [slug]                 show flagged / last state",
  "  ada c run [slug] [--defect]       run deterministic C checks",
  "  ada pom [slug]                    print the Problem Operating Model (intent · constraints · unknowns · verifier · residue)",
  "  ada watch [slug] [--once] [--json] watch a compile run live (the real-time spine);",
  "                                    --once prints one snapshot, --json the raw snapshot",
  "  ada export [slug]                 list exported files",
  "  ada key                           how Ada reaches the model: subscription (no key) or API key",
  "",
  dim(
    "  default slug: showcase  ·  model: Claude Code subscription (no key) or ANTHROPIC_API_KEY",
  ),
].join("\n");

async function cmdInit(): Promise<void> {
  await mkdir(packsRoot(cwd), { recursive: true });
  console.log(
    paint("◈ ", "terracotta") +
      "initialized " +
      dim(relative(cwd, packsRoot(cwd)) || ".ada/packs"),
  );
  console.log(dim('  next: ada compile "your idea here"'));
}

function resolveSlug(value: string | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "showcase";
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(v) || v.includes("..")) {
    throw new Error(
      `invalid slug "${v}" — use letters, digits, dot, dash, underscore`,
    );
  }
  return v;
}

/**
 * The LAST-RESORT fallback cluster set for the engine path, used only if cluster proposal
 * AND its own default somehow yield nothing (it never does — `proposeClusters` already falls
 * back to `DEFAULT_PROPOSED_CLUSTERS`). Kept for back-compat and as a belt-and-braces guard.
 * ROOT anchors the world model; UNK is the unknown-unknowns area. (Pre-P7 this was the
 * hardcoded marketing-shaped set `["ROOT","ATT","COPY","SEO","UNK"]`; P7 derives areas from
 * the intent via `proposeClusters` instead.)
 */
const DEFAULT_ENGINE_CLUSTERS = DEFAULT_PROPOSED_CLUSTERS;

async function cmdCompile(args: string[]): Promise<void> {
  const { positional, flags } = parseFlags(args);
  const rawIntent = positional.join(" ").trim();
  const intent =
    rawIntent ||
    "An AI-native command center for my local service business: clients, bookings, staff, payments, content, campaigns, reviews, and automations.";
  const slug = resolveSlug(
    typeof flags["slug"] === "string" ? (flags["slug"] as string) : undefined,
  );
  const useEngine = Boolean(flags["engine"]);
  if (!rawIntent && !useEngine) {
    console.log(dim("  (no intent given — compiling the showcase demo)"));
  }
  await mkdir(packsRoot(cwd), { recursive: true });

  if (useEngine) {
    await compileWithEngine(slug, intent, buildEngineOptions(flags));
    return;
  }

  const model = buildShowcasePack(slug, intent);
  const manifest = await writePack(cwd, model);
  const p = paths(cwd, slug);

  console.log(
    paint("◈ compiled", "terracotta") + dim(`  ${relative(cwd, p.root)}`),
  );
  console.log("");
  console.log(
    `  ${bold(String(manifest.nodeCount))} nodes · ${bold(String(manifest.edgeCount))} edges · ${paint(String(manifest.checkCount) + " checks", "green")} · ${paint(String(manifest.residueCount) + " residue", "amber")}`,
  );
  console.log(`  clusters: ${dim(manifest.clusters.join(", "))}`);
  console.log("");
  console.log(
    "  " +
      paint("first graph moment", "deep_blue") +
      dim(`   ada open ${slug} L2C.001`),
  );
  console.log(
    "  " +
      paint("first trust moment", "green") +
      dim(`   ada c run ${slug} --defect`),
  );
  console.log(
    "  " +
      paint("executor export", "cyan") +
      dim(`      ${relative(cwd, p.claudeDir)}/CLAUDE.md`),
  );
}

/**
 * Ensure the structural anchors are present and positioned (P7): ROOT first (world-model
 * anchor), UNK last (unknown-unknowns), the domain areas between — without duplicating either
 * if the caller already supplied them. Pure; used for both the proposed set and the
 * `--clusters` override.
 */
export function withAnchors(areas: ClusterDef[]): ClusterDef[] {
  // Delegates to the shared engine seam so the override path is identical across front-ends.
  return withAnchorsShared(areas);
}

/**
 * The REAL compile path (FREEZE.md §4 P1): drive the U2F engine end-to-end.
 *   engineSeed(intent)
 *     → proposeClusters (ONE compile-time model call → DOMAIN-appropriate areas; P7)
 *        (or `--clusters=A,B,C` override, skipping the proposal)
 *     → excavatePack (one compile-time model call per cluster, model-free gate)
 *     → assemblePackGated (pack Seed + cluster label registry DERIVED, not a literal)
 *     → writePack (the pack lands on disk).
 * Every network call lives solely in `anthropicClient()` (engine/model.ts); the key is read
 * from ANTHROPIC_API_KEY there and never logged/hardcoded. Multiple COMPILE-TIME calls are
 * fine under A1/A9 — what they forbid is a runtime / post-compile call.
 */
async function compileWithEngine(
  slug: string,
  intent: string,
  options: EngineOptions = {},
  /**
   * Optional richer Seed (AXIOM A2): the `ada ctx init` interview output. When present it
   * DRIVES the excavation (proposeClusters + excavatePack read it) instead of the bare-intent
   * `engineSeed`, so the interview's captured expectations shape the world model. Absent for a
   * plain `ada compile --engine`, which derives a minimal Seed from the intent alone.
   */
  seedOverride?: Seed,
): Promise<void> {
  // The whole pipeline now lives in the SHARED `engineCompile` seam (engine/compile.ts) so the
  // CLI and the TUI's Compile flow cannot drift. The CLI keeps its own console output below;
  // behaviour (depth/model/clusters semantics, the seed-override vs derived-seed rule, the
  // first-node pick, the gate-empty throw) is identical — it was MOVED, not changed.
  //   • `seed` drives proposal + excavation (bare-intent `engineSeed`, or the interview's Seed).
  //   • `seedOverride` is the assembly override (interview → SEED.md verbatim; absent → derived).
  let seed = seedOverride ?? engineSeed(intent);
  // Repo-aware compile (spine step 1): ingest the existing repo → COMPILE it to a bounded
  // digest → attach as ∵ source so the excavator builds ON real code. Copy (not mutate) so
  // an interview `seedOverride` is still persisted verbatim as SEED.md (A2).
  if (options.repo) {
    const ingested = ingestRepo(resolve(cwd, options.repo));
    const digest = repoDigest(ingested);
    seed = { ...seed, repoContext: digest };
    console.log(
      dim(
        `  repo-aware: ${ingested.admittedCount} sources → ${Buffer.byteLength(digest, "utf8")}B digest (∵ source)`,
      ),
    );
  }
  const { model, manifest, firstNodeId, rejected, usage } = await engineCompile(
    {
      cwd,
      slug,
      intent,
      seed,
      ...(seedOverride ? { seedOverride } : {}),
      opts: {
        // Live path: expand a thin intent before excavating (self-skips on the interview seed).
        normalize: true,
        // …and turn the excavated world into a plan (gated Action nodes → POM execution_plan).
        plan: true,
        ...(options.perCluster ? { perCluster: options.perCluster } : {}),
        ...(options.model ? { model: options.model } : {}),
        ...(options.clusters ? { clusters: options.clusters } : {}),
        ...(options.provider ? { provider: options.provider } : {}),
      },
    },
  );
  const p = paths(cwd, slug);
  const firstNode = firstNodeId;

  console.log(
    paint("◈ compiled", "terracotta") +
      dim(`  ${relative(cwd, p.root)}`) +
      paint("  (engine)", "plum"),
  );
  console.log("");
  console.log(
    `  ${bold(String(manifest.nodeCount))} nodes · ${bold(String(manifest.edgeCount))} edges · ${paint(String(manifest.checkCount) + " checks", "green")} · ${paint(String(manifest.residueCount) + " residue", "amber")}`,
  );
  console.log(`  clusters: ${dim(manifest.clusters.join(", "))}`);
  if (usage.calls > 0) {
    const k = (n: number) =>
      n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n);
    const cost =
      usage.costUsd > 0
        ? `${usage.costEstimated ? "≈" : ""}$${usage.costUsd.toFixed(2)}`
        : "—";
    // claude-code reports an exact $ even on the subscription (it's the API-equivalent value);
    // before 2026-06-15 that's included in the plan, after it's drawn from the Agent SDK credit.
    const note = usage.costEstimated
      ? dim(" (API, est.)")
      : dim(
          " (subscription: included until 2026-06-15, then Agent SDK credit)",
        );
    console.log(
      "  " +
        paint("spend", "amber") +
        dim(
          `  ${usage.calls} calls · ${k(usage.inputTokens)} in · ${k(usage.outputTokens)} out · ${k(usage.cacheReadTokens)} harness-cache · `,
        ) +
        cost +
        note,
    );
  }
  if (rejected.length) {
    console.log(
      dim(
        `  ${rejected.length} candidate(s) rejected by the gate: ${rejected
          .map((r) => r.spec.id)
          .join(", ")}`,
      ),
    );
  }
  console.log("");
  console.log(
    "  " +
      paint("first graph moment", "deep_blue") +
      dim(`   ada open ${slug} ${firstNode}`),
  );
  console.log(
    "  " +
      paint("first trust moment", "green") +
      dim(`   ada c run ${slug} --defect`),
  );
  console.log(
    "  " +
      paint("executor export", "cyan") +
      dim(`      ${relative(cwd, p.claudeDir)}/CLAUDE.md`),
  );
}

async function cmdOpen(args: string[]): Promise<void> {
  const { positional } = parseFlags(args);
  const slug = resolveSlug(positional[0]);
  const nodeId = positional[1];
  if (nodeId || !process.stdin.isTTY) {
    console.log(renderStatic(cwd, slug, nodeId));
    return;
  }
  await interactive(cwd, slug);
}

async function cmdTui(args: string[]): Promise<void> {
  const { positional } = parseFlags(args);
  const slug = resolveSlug(positional[0]);
  const nodeId = positional[1];

  // The Ink workbench needs a TTY *and* raw-mode support (useInput). Without it
  // (pipes, CI, scripted use, or a stdin that can't raw-mode), fall back to the
  // static render so `ada tui` is never a dead end.
  if (!canRunInk(process.stdin, process.stdout)) {
    console.log(renderStatic(cwd, slug, nodeId));
    return;
  }

  // Best-effort: ask the terminal for a roomy 100×50 window (CSI 8 ; rows ; cols t).
  // xterm/iTerm2/kitty honor it; Terminal.app/tmux ignore it — harmless either way,
  // and useWindowSize() then adapts the layout to whatever size we actually get.
  process.stdout.write("[8;50;100t");

  // Defer the React/Ink import so non-TTY callers never pay for it.
  const { createElement } = await import("react");
  const { render } = await import("ink");
  const { App } = await import("./tui/ink/App.js");
  const { loadPackData, readPackState, writePackState, listPacks } =
    await import("./tui/ink/usePack.js");

  const { graph, manifest, stateFile } = loadPackData(cwd, slug);
  const initialState = readPackState(stateFile);
  const packs = listPacks(cwd);

  // Safety net (TERM.001): restore the terminal on ANY exit / SIGTERM, so a crash or `kill`
  // mid-session never leaves the user's shell in raw mode + the alternate screen.
  const disarmRestore = armTerminalRestore();
  try {
    const { waitUntilExit } = render(
      createElement(App, {
        slug,
        graph,
        manifest,
        initialState,
        packs,
        onPersist: (state) => writePackState(stateFile, state),
        onExport: (s) => {
          // Surface the export hint; the deterministic export already lives on disk.
          process.stderr.write(
            paint("⇒ ", "cyan") +
              dim(`run \`ada export ${s}\` for the file list\n`),
          );
        },
      }),
      // alternateScreen: clean buffer (restores scrollback on exit, vim-style);
      // incrementalRendering: redraw only changed lines (no flicker); cap at 30fps.
      // All ignored when non-interactive, so the canRunInk fallback stays safe.
      { alternateScreen: true, incrementalRendering: true, maxFps: 30 },
    );
    await waitUntilExit();
  } catch (err) {
    // Raw mode can still be refused by some terminals; never leave a blank flash.
    restoreTerminal();
    const msg = err instanceof Error ? err.message : String(err);
    console.error(paint("✗ TUI could not start: ", "rose") + dim(msg));
    console.error(dim("  falling back to the static view —"));
    console.log(renderStatic(cwd, slug, nodeId));
  } finally {
    // Normal exit: Ink already restored, but make it certain, then drop the handlers.
    restoreTerminal();
    disarmRestore();
  }
}

async function cmdDeeper(args: string[]): Promise<void> {
  const { positional } = parseFlags(args);
  const slug = resolveSlug(positional[0]);
  const nodeId = positional[1];
  if (!nodeId) throw new Error("usage: ada deeper <slug> <nodeId>");
  const { graph } = loadPack(cwd, slug);
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) throw new Error(`No node ${nodeId} in pack ${slug}.`);
  // Prefer the engineered wiki.md on disk (the fat node) over the generated capsule.
  const wikiPath = join(nodeDir(cwd, slug, node), "wiki.md");
  console.log(
    existsSync(wikiPath) ? readFileSync(wikiPath, "utf8") : nodeWiki(node),
  );
}

async function cmdFlag(args: string[]): Promise<void> {
  const { positional } = parseFlags(args);
  const slug = resolveSlug(positional[0]);
  const nodeId = positional[1];
  if (!nodeId) throw new Error("usage: ada flag <slug> <nodeId>");
  console.log(paint(flagNode(cwd, slug, nodeId), "slate"));
}

/**
 * `ada expand <slug> <nodeId>` — fractal descent: re-compile ONE node into its own sub-tree (travel
 * the language). Refuses a hole (a leaf, never a seed — A2); else lands a sub-pack at <slug>__<nodeId>,
 * budget-gated by --depth (≤k children) and reporting whether the branch surfaced new ground or saturated.
 */
async function cmdExpand(args: string[]): Promise<void> {
  const { positional, flags } = parseFlags(args);
  const slug = resolveSlug(positional[0]);
  const nodeId = positional[1];
  if (!nodeId)
    throw new Error(
      "usage: ada expand <slug> <nodeId> [--depth=N] [--provider=…]",
    );
  const { graph } = loadPack(cwd, slug);
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) throw new Error(`No node ${nodeId} in pack ${slug}.`);
  const gate = canExpand(node);
  if (!gate.ok) {
    console.log(
      paint("✗ ", "amber") + `cannot expand ${nodeId} — ${gate.reason}`,
    );
    return;
  }
  const engineOptions = buildEngineOptions(flags);
  const parentSeed = engineSeed(
    `${node.label}. ${node.localContext.summary}`.trim(),
  );
  console.log(
    dim(`◈ expanding ${slug}/${nodeId} into its own sub-tree (one compile)…`),
  );
  const r = await expandNode({
    cwd,
    parentSlug: slug,
    node,
    parentSeed,
    opts: {
      normalize: true,
      plan: true,
      ...(engineOptions.perCluster
        ? { perCluster: engineOptions.perCluster }
        : {}),
      ...(engineOptions.provider ? { provider: engineOptions.provider } : {}),
    },
  });
  if (!r.expanded) {
    console.log(paint("✗ ", "amber") + r.reason);
    return;
  }
  console.log(
    paint("◈ expanded", "terracotta") +
      dim(
        `  ${r.subSlug}  ·  ${r.nodeCount} nodes  ·  ${r.saturated ? "saturated (a leaf — deeper yields no new ground)" : "new ground surfaced"}`,
      ),
  );
  console.log(dim(`  travel further:  ada open ${r.subSlug}`));
}

async function cmdResume(args: string[]): Promise<void> {
  const { positional } = parseFlags(args);
  console.log(resume(cwd, resolveSlug(positional[0])));
}

async function cmdC(args: string[]): Promise<void> {
  const { positional, flags } = parseFlags(args);
  const sub = positional[0];
  if (sub !== "run") throw new Error("usage: ada c run [slug] [--defect]");
  const slug = resolveSlug(positional[1]);
  // Includes the pure model-free salience-density gate (4-a): an over-budget CLAUDE.md
  // FAILS here. Non-zero exit on any failure so the gate is real for callers/CI.
  const report = runChecksWithDensity(paths(cwd, slug).root, {
    defect: Boolean(flags["defect"]),
  });
  console.log(renderReport(report));
  if (report.failed > 0) process.exitCode = 1;
}

async function cmdExport(args: string[]): Promise<void> {
  const { positional } = parseFlags(args);
  const slug = resolveSlug(positional[0]);
  const p = paths(cwd, slug);
  if (!existsSync(p.exportsDir))
    throw new Error(`No exports for ${slug}. Run \`ada compile\` first.`);
  console.log(
    paint("⇒ exports", "cyan") + dim(`  ${relative(cwd, p.exportsDir)}`),
  );
  for (const sub of ["claude", "blueprint"]) {
    const dir = join(p.exportsDir, sub);
    if (!existsSync(dir)) continue;
    console.log("  " + bold(sub));
    const walk = async (d: string): Promise<void> => {
      for (const ent of await readdir(d, { withFileTypes: true })) {
        const full = join(d, ent.name);
        if (ent.isDirectory()) await walk(full);
        else console.log("    " + dim(relative(p.exportsDir, full)));
      }
    };
    await walk(dir);
  }
}

/**
 * `ada pom <slug>` — print the pack's Problem Operating Model (the governed epistemic state:
 * intent · constraints · unknowns · verifier · residue). Prefers the compile-time POM.md (it
 * carries the real seed); for an older pack without one, projects it live from the typed graph
 * with a thin manifest-derived intent kernel — so the unique-function output is always one
 * command away, never a file you must dig for.
 */
function cmdPom(args: string[]): void {
  const { positional } = parseFlags(args);
  const slug = resolveSlug(positional[0]);
  const p = paths(cwd, slug);
  const pomFile = join(p.blueprintDir, "POM.md");
  if (existsSync(pomFile)) {
    console.log(readFileSync(pomFile, "utf8"));
    return;
  }
  if (!existsSync(p.graphJson)) {
    throw new Error(`No pack "${slug}". Run \`ada compile\` first.`);
  }
  const graph = JSON.parse(readFileSync(p.graphJson, "utf8"));
  const manifest = JSON.parse(readFileSync(p.manifest, "utf8"));
  // Older pack: no compiled POM. Project live with a thin kernel (honest — the seed wasn't kept).
  const model = {
    slug,
    seed: {
      rootIntent: manifest.slug ?? slug,
      domain: manifest.product ?? slug,
      buildObjective:
        "(re-compile this pack to capture the full intent kernel)",
      trustObjective: "see the verifier section",
      unknownContext: [],
    },
    graph,
  } as unknown as Parameters<typeof projectPOM>[0];
  console.log(projectPOM(model));
}

/**
 * Map a finished interview transcript onto the engine Seed (AXIOM A2: every field traces to an
 * answer; never a domain literal). Starts from the bare-intent `engineSeed` so any field the
 * interview did NOT cover keeps an honest, intent-derived default, then folds each answer into
 * its `field` via the SAME pure `applyAnswer` the headless loop uses (scalars overwrite, lists
 * accumulate). Pure — no model, no I/O.
 */
export function seedFromInterview(
  intent: string,
  turns: InterviewTurn[],
): Seed {
  // Start from the bare-intent Seed (scalar defaults are honest, intent-derived), but CLEAR
  // the accumulating list fields the interview owns — so a captured answer is not mixed with a
  // generic placeholder (e.g. the baseline "Local-first." constraint). `sources` is left as-is
  // (it is the provenance trail, not an interview field). With no turns this still yields a
  // clean, honest Seed; the bare `ada compile --engine` keeps its own `engineSeed` untouched.
  const base = engineSeed(intent);
  let seed: Seed = {
    ...base,
    knownContext: [],
    unknownContext: [],
    assumptions: [],
    constraints: [],
    risks: [],
  };
  for (const t of turns) {
    seed = applyAnswer(seed, t.step.field, t.answer);
  }
  return seed;
}

/**
 * `ada ctx init [--slug=x] [--model=id] [--compile]` — the conversational interview that runs
 * BEFORE compile. It captures the user's implicit expectations into the Seed, writes the Seed
 * to the pack on disk, then EXITS (never a session/daemon: the finite loop is bounded by
 * MAX_TURNS, AXIOM A6/A9). One model call per turn via `anthropicClient` (the only network
 * boundary, A1/A9). With `--compile` it chains straight into the engine using the captured Seed.
 *
 * Non-TTY (no raw mode): mirrors `cmdTui` — never hangs. It prints a clear message and falls
 * back to compiling from the bare intent (so the command is never a dead end in a pipe/CI).
 */
async function cmdCtx(args: string[]): Promise<void> {
  const { positional, flags } = parseFlags(args);
  const sub = positional[0];
  if (sub !== "init") {
    throw new Error("usage: ada ctx init [--slug=x] [--model=id] [--compile]");
  }
  const slug = resolveSlug(
    typeof flags["slug"] === "string" ? (flags["slug"] as string) : undefined,
  );
  const intent =
    positional.slice(1).join(" ").trim() ||
    "A tool I want to build but haven't fully described yet.";
  const doCompile = Boolean(flags["compile"]);
  const clientOpts =
    typeof flags["model"] === "string" && flags["model"].trim()
      ? { model: flags["model"].trim() }
      : {};
  const engineOptions = buildEngineOptions(flags);

  await mkdir(packsRoot(cwd), { recursive: true });
  const client = defaultModelClient({
    ...clientOpts,
    ...(engineOptions.provider ? { provider: engineOptions.provider } : {}),
  });
  const baseSeed = engineSeed(intent);

  // Non-TTY fallback (mirror cmdTui): the chat UI needs raw mode. Without it we do NOT hang —
  // we explain, then either compile from the bare intent (--compile) or instruct the user.
  if (!canRunInk(process.stdin, process.stdout)) {
    console.error(
      paint("⟦ ctx init ⟧ ", "plum") +
        dim(
          "needs an interactive terminal for the chat interview (no raw-mode TTY here).",
        ),
    );
    if (doCompile) {
      console.error(dim("  compiling from the bare intent instead —"));
      await compileWithEngine(slug, intent, engineOptions);
    } else {
      console.error(
        dim(
          `  run it in a real terminal, or compile directly:\n    ada compile --engine --slug=${slug} "${intent}"`,
        ),
      );
    }
    return;
  }

  // Defer the React/Ink import so non-TTY callers never pay for it (matches cmdTui).
  const { createElement } = await import("react");
  const { render } = await import("ink");
  const { Interview } = await import("./tui/ink/Interview.js");

  // The interview's per-turn fetch: ONE compile-time model call (A1/A9). The finite loop /
  // hard cap lives HERE in the host (the UI is a thin renderer): once MAX_TURNS turns are
  // recorded we return null, which ends the interview — it can never become a daemon.
  let captured: InterviewTurn[] = [];
  const getNextStep = async (
    turns: InterviewTurn[],
  ): Promise<InterviewStep | null> => {
    if (turns.length >= MAX_TURNS) return null; // termination guarantee (A6/A9)
    const seedSoFar = seedFromInterview(intent, turns);
    return nextStep(client, seedSoFar, turns);
  };

  const { waitUntilExit } = render(
    createElement(Interview, {
      rootIntent: intent,
      getNextStep,
      onFinish: (turns: InterviewTurn[]) => {
        captured = turns;
      },
      maxTurns: MAX_TURNS,
    }),
    { alternateScreen: true, incrementalRendering: true, maxFps: 30 },
  );
  await waitUntilExit();

  const seed = seedFromInterview(intent, captured);

  if (doCompile) {
    // Chain straight into the engine with the captured Seed driving the excavation (A2).
    await compileWithEngine(slug, intent, engineOptions, seed);
    return;
  }

  // Otherwise: persist the Seed into the pack on disk and point at the next step. We assemble a
  // Seed-only pack via the writer's seed persistence (SEED.md) without a full excavation.
  await writeSeedOnly(slug, seed);
  const p = paths(cwd, slug);
  console.log(
    paint("⟦ ctx init ⟧ captured", "plum") + dim(`  ${relative(cwd, p.seed)}`),
  );
  console.log("");
  console.log(
    `  ${bold(String(captured.length))} answers captured into the Seed`,
  );
  console.log("");
  console.log(
    "  " +
      paint("next", "deep_blue") +
      dim(`   ada compile --engine --slug=${slug} "${seed.rootIntent}"`),
  );
}

/**
 * Persist a Seed to the pack on disk WITHOUT a full excavation (the no-`--compile` path of
 * `ada ctx init`). Reuses the same SEED.md shape the pack writer emits, so a later
 * `ada compile --engine` can pick up where the interview left off. Pure I/O — no model.
 */
async function writeSeedOnly(slug: string, seed: Seed): Promise<void> {
  const p = paths(cwd, slug);
  await mkdir(p.root, { recursive: true });
  const block = (label: string, items: string[]) =>
    [`## ${label}`, ...items.map((i) => `- ${i}`), ""].join("\n");
  const md = [
    "# ⟦ SEED ⟧",
    "",
    `**Root intent.** ${seed.rootIntent}`,
    "",
    `**Domain.** ${seed.domain}`,
    `**User role.** ${seed.userRole}`,
    "",
    `**Build objective.** ${seed.buildObjective}`,
    `**Knowledge objective.** ${seed.knowledgeObjective}`,
    `**Trust objective.** ${seed.trustObjective}`,
    "",
    block("Known context", seed.knownContext),
    block("Unknown context (residue)", seed.unknownContext),
    block("Assumptions", seed.assumptions),
    block("Sources", seed.sources),
    block("Constraints", seed.constraints),
    block("Risks", seed.risks),
    "> Provenance: captured by `ada ctx init` (the pre-compile interview); compile with `ada compile --engine`.",
    "",
  ].join("\n");
  await writeFile(p.seed, md, "utf8");
}

/**
 * Show how Ada will reach the model — value-free (AXIOM A9 — never print the secret). Two paths:
 * the Claude Code SUBSCRIPTION (the local `claude` CLI, no key) and the API key. Reports which
 * provider auto-resolution would pick, so a keyless user sees they can compile with zero setup.
 */
function cmdKey(): void {
  const hasKey = Boolean((process.env["ANTHROPIC_API_KEY"] ?? "").trim());
  const hasClaude = claudeCodeAvailable();
  const provider = resolveProvider({
    env: process.env,
    claudeAvailable: hasClaude,
  });

  console.log(bold("Model access") + dim(" — Ada needs ONE of these:"));
  console.log(
    (hasClaude ? paint("✓ ", "green") : paint("✗ ", "rose")) +
      "Claude Code subscription " +
      dim(
        hasClaude
          ? "(`claude` on PATH — no API key needed; runs on your plan)"
          : "(install Claude Code + `claude login` to compile without a key)",
      ),
  );
  console.log(
    (hasKey ? paint("✓ ", "green") : paint("✗ ", "rose")) +
      "ANTHROPIC_API_KEY " +
      dim(
        hasKey
          ? "(loaded from: shell env · ./.env · ~/.ada/.env)"
          : "(optional — `mkdir -p ~/.ada && printf 'ANTHROPIC_API_KEY=sk-ant-...\\n' >> ~/.ada/.env`)",
      ),
  );
  console.log(
    dim(
      `  → auto-selects: ${bold(provider === "claude-code" ? "claude-code (subscription)" : "api (key)")}` +
        "  ·  force with --provider=claude-code|api",
    ),
  );
  if (!hasClaude && !hasKey) {
    console.log(
      paint("  ! ", "amber") +
        dim(
          "neither is set up yet — do one of the two above, then `ada compile --engine ...`",
        ),
    );
  }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

/**
 * `ada watch [slug] [--once] [--json]` — render the engine's live compile snapshot.
 *
 * Default (TTY): poll `.compile-progress.json` and redraw the tree in place until the run ends.
 * `--once`: print one snapshot and exit (the cheap call the /ada skill makes each poll tick).
 * `--json`: print the raw snapshot for deterministic parsing. Non-TTY default degrades to --once.
 * No progress file → a clear message + non-zero exit (nothing to watch).
 *
 * Staleness (the crash contract): a compile that dies leaves status "running" forever; if the
 * snapshot hasn't advanced for STALE_MS we stop and say so rather than spinning indefinitely.
 */
async function cmdWatch(args: string[]): Promise<void> {
  const { positional, flags } = parseFlags(args);
  const slug = resolveSlug(positional[0]);
  const first = readSnapshot(cwd, slug);
  if (!first) {
    console.error(
      paint(`no compile in flight for ${slug}`, "rose") +
        dim(`   (run: ada compile --engine "…" --slug=${slug})`),
    );
    process.exitCode = 1;
    return;
  }
  if (flags["json"]) {
    console.log(JSON.stringify(first, null, 2));
    return;
  }
  if (flags["once"] || !process.stdout.isTTY) {
    console.log(renderSnapshot(first));
    return;
  }

  const STALE_MS = 120_000;
  let prevLines = 0;
  let tick = 0;
  for (;;) {
    const snap = readSnapshot(cwd, slug) ?? first;
    const out = renderSnapshot(snap, tick++);
    if (prevLines > 0) process.stdout.write(`\x1b[${prevLines}A\x1b[0J`);
    process.stdout.write(`${out}\n`);
    prevLines = out.split("\n").length;
    if (snap.status !== "running") break;
    const age = Date.now() - new Date(snap.updatedAt).getTime();
    if (age > STALE_MS) {
      console.log(
        dim(
          `  (no update for ${Math.round(age / 1000)}s — the compile may have stopped)`,
        ),
      );
      break;
    }
    await sleep(250);
  }
}

async function main(): Promise<void> {
  // Load the API key (and optional ADA_MODEL) from ./.env or ~/.ada/.env BEFORE any command,
  // so the engine's single compile-time call picks it up. Env always wins; the value is never
  // logged (AXIOM A9 — local, sovereign).
  loadEnvConfig();
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case "init":
      return cmdInit();
    case "compile":
      return cmdCompile(rest);
    case "ctx":
      return cmdCtx(rest);
    case "key":
      return cmdKey();
    case "open":
      return cmdOpen(rest);
    case "tui":
      return cmdTui(rest);
    case "deeper":
      return cmdDeeper(rest);
    case "expand":
      return cmdExpand(rest);
    case "flag":
      return cmdFlag(rest);
    case "resume":
      return cmdResume(rest);
    case "c":
      return cmdC(rest);
    case "export":
      return cmdExport(rest);
    case "pom":
      return cmdPom(rest);
    case "watch":
      return cmdWatch(rest);
    case undefined:
      // Bare `ada` in a terminal opens the workbench (what "ada" should do —
      // the showcase/default pack's tree). Piped / non-TTY falls through to help
      // so scripts and `ada | …` still get usage text, never a stuck raw-mode TUI.
      if (canRunInk(process.stdin, process.stdout)) return cmdTui(rest);
      console.log(HELP);
      return;
    case "help":
    case "--help":
    case "-h":
      console.log(HELP);
      return;
    default:
      console.error(paint(`unknown command: ${cmd}`, "rose"));
      console.log(HELP);
      process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(paint("✗ " + msg, "rose"));
  process.exitCode = 1;
});
