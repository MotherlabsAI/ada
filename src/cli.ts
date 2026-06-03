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
import { mkdir, readdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { buildShowcasePack } from "./compile/showcase.js";
import { assemblePackGated } from "./compile/assemble.js";
import { excavatePack } from "./compile/engine/orchestrate.js";
import { anthropicClient } from "./compile/engine/model.js";
import { writePack } from "./pack/writer.js";
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
import { paint, bold, dim } from "./core/grammar.js";
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

const HELP = [
  bold("ada") + dim(" — semantic context compiler (Ada by Motherlabs)"),
  "",
  "  ada init                          scaffold .ada/ here",
  '  ada compile "<intent>" [--slug=x] compile intent into a pack',
  '  ada compile --engine "<intent>"  compile via the U2F engine (real model call)',
  "  ada open [slug] [nodeId]          navigate the pack",
  "  ada tui [slug]                    launch the Ink workbench (TTY)",
  "  ada deeper <slug> <nodeId>        full wiki article for a node",
  "  ada flag <slug> <nodeId>          flag a node",
  "  ada resume [slug]                 show flagged / last state",
  "  ada c run [slug] [--defect]       run deterministic C checks",
  "  ada export [slug]                 list exported files",
  "",
  dim("  default slug: showcase"),
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
 * A small, domain-agnostic default cluster set for the engine path. ROOT anchors the
 * world model; ATT/COPY/SEO/UNK are the calibration-exemplar clusters the excavator
 * prompt is tuned against (rich pathways + Kano ranking are a later goal — keep it
 * simple). The model excavates one candidate per cluster; the gate keeps the impressers.
 */
const DEFAULT_ENGINE_CLUSTERS = ["ROOT", "ATT", "COPY", "SEO", "UNK"];

/**
 * A minimal engine Seed derived from the intent (AXIOM A2: traced, never a domain
 * literal). The excavator reads rootIntent/domain/objective + the cluster; the pack's
 * own richer Seed is DERIVED by `assemblePackGated` from the intent + kept nodes, so the
 * engine pack never carries the booking-showcase chrome (FREEZE.md §5 critic-fix).
 */
function engineSeed(intent: string): Seed {
  const domain = intent.replace(/^(a|an|the)\s+/i, "").trim() || intent;
  return {
    rootIntent: intent,
    domain,
    userRole: "The person who brought this intent",
    buildObjective: `Compile a working world model of ${domain} an executor can build from.`,
    knowledgeObjective: `A navigable, compounding map of ${domain}.`,
    trustObjective:
      "Deterministic checks where the structure is checkable; honest residue where it is not.",
    knownContext: [
      "Derived solely from the stated intent; no external facts assumed.",
    ],
    unknownContext: [],
    assumptions: [],
    sources: ["User intent"],
    constraints: ["Local-first."],
    risks: [],
  };
}

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
    await compileWithEngine(slug, intent);
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
 * The REAL compile path (FREEZE.md §4 P1): drive the U2F engine end-to-end.
 *   engineSeed(intent) + default clusters + anthropicClient()  (the single A1/A9 boundary)
 *     → excavatePack (one compile-time model call per cluster, model-free gate)
 *     → assemblePackGated (pack Seed DERIVED from intent + kept nodes, not a literal)
 *     → writePack (the pack lands on disk).
 * The live network call lives solely in `anthropicClient()` (engine/model.ts); the key is
 * read from ANTHROPIC_API_KEY there and never logged/hardcoded.
 */
async function compileWithEngine(slug: string, intent: string): Promise<void> {
  const { kept, rejected } = await excavatePack(
    engineSeed(intent),
    DEFAULT_ENGINE_CLUSTERS,
    anthropicClient(),
  );
  if (kept.length === 0) {
    throw new Error(
      "The engine produced no node that cleared the gate. Every candidate was rejected " +
        "as generic or un-traced. Refine the intent and retry.",
    );
  }
  const { model } = assemblePackGated(slug, intent, kept);
  const manifest = await writePack(cwd, model);
  const p = paths(cwd, slug);
  // Point the hints at a REAL kept node (prefer a non-ROOT capsule so "open" lands on an
  // excavated insight, not the synthesized root).
  const firstNode =
    model.graph.nodes.find((n) => n.id !== "ROOT.000")?.id ??
    model.graph.nodes[0]?.id ??
    "ROOT.000";

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
  const { loadPackData, readPackState, writePackState } =
    await import("./tui/ink/usePack.js");

  const { graph, manifest, stateFile } = loadPackData(cwd, slug);
  const initialState = readPackState(stateFile);

  try {
    const { waitUntilExit } = render(
      createElement(App, {
        slug,
        graph,
        manifest,
        initialState,
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error(paint("✗ TUI could not start: ", "rose") + dim(msg));
    console.error(dim("  falling back to the static view —"));
    console.log(renderStatic(cwd, slug, nodeId));
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

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case "init":
      return cmdInit();
    case "compile":
      return cmdCompile(rest);
    case "open":
      return cmdOpen(rest);
    case "tui":
      return cmdTui(rest);
    case "deeper":
      return cmdDeeper(rest);
    case "flag":
      return cmdFlag(rest);
    case "resume":
      return cmdResume(rest);
    case "c":
      return cmdC(rest);
    case "export":
      return cmdExport(rest);
    case undefined:
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
