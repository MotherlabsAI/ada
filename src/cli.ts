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
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { buildShowcasePack } from "./compile/showcase.js";
import { writePack } from "./pack/writer.js";
import { paths, packsRoot } from "./pack/layout.js";
import { nodeWiki } from "./pack/wiki.js";
import {
  loadPack,
  renderStatic,
  interactive,
  flagNode,
  resume,
} from "./tui/navigator.js";
import { runChecks, renderReport } from "./c/run.js";
import { paint, bold, dim } from "./core/grammar.js";

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

async function cmdCompile(args: string[]): Promise<void> {
  const { positional, flags } = parseFlags(args);
  const rawIntent = positional.join(" ").trim();
  const intent =
    rawIntent ||
    "An AI-native command center for my local service business: clients, bookings, staff, payments, content, campaigns, reviews, and automations.";
  const slug = resolveSlug(
    typeof flags["slug"] === "string" ? (flags["slug"] as string) : undefined,
  );
  if (!rawIntent) {
    console.log(dim("  (no intent given — compiling the showcase demo)"));
  }
  await mkdir(packsRoot(cwd), { recursive: true });
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

  // The Ink workbench needs a TTY. Without one (pipes, CI, scripted use),
  // fall back to the existing static render so `ada tui` is never a dead end.
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.log(renderStatic(cwd, slug, nodeId));
    return;
  }

  // Defer the React/Ink import so non-TTY callers never pay for it.
  const { createElement } = await import("react");
  const { render } = await import("ink");
  const { App } = await import("./tui/ink/App.js");
  const { loadPackData, readPackState, writePackState } =
    await import("./tui/ink/usePack.js");

  const { graph, manifest, stateFile } = loadPackData(cwd, slug);
  const initialState = readPackState(stateFile);

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
  );
  await waitUntilExit();
}

async function cmdDeeper(args: string[]): Promise<void> {
  const { positional } = parseFlags(args);
  const slug = resolveSlug(positional[0]);
  const nodeId = positional[1];
  if (!nodeId) throw new Error("usage: ada deeper <slug> <nodeId>");
  const { graph } = loadPack(cwd, slug);
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) throw new Error(`No node ${nodeId} in pack ${slug}.`);
  console.log(nodeWiki(node));
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
  const report = runChecks(paths(cwd, slug).root, {
    defect: Boolean(flags["defect"]),
  });
  console.log(renderReport(report));
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
