/**
 * engineCompile — the SHARED engine compile seam (one place, two front-ends).
 *
 * The CLI (`ada compile --engine`, `ada ctx init --compile`) and the Ink TUI's "Compile an
 * idea" flow both need the SAME end-to-end pipeline:
 *
 *   engineSeed(intent) (or an injected richer Seed, AXIOM A2)
 *     → proposeClusters   (ONE compile-time model call → domain-appropriate areas; P7)
 *        (or an explicit `opts.clusters` override, skipping the proposal)
 *     → excavatePack      (compile-time model calls per cluster; model-free gate, A3)
 *     → assemblePackGated (pack Seed + cluster label registry DERIVED, never a literal)
 *     → writePack         (the pack lands on disk)
 *
 * Factoring it here means the TUI and CLI cannot drift. The model is INJECTABLE
 * (`opts.model?: ModelClient`, default `anthropicClient(...)`) so tests stub it and NO live
 * call happens — the only module permitted a network is `engine/model.ts` (AXIOM A1/A9). This
 * module holds no network token (grep-guarded by the orchestrate boundary test's siblings).
 *
 * Multiple COMPILE-TIME calls are fine under A1/A9; what they forbid is a runtime /
 * post-compile call. The gate inside `excavatePack` stays model-free (A3).
 */
import type { Seed, PackModel, PackManifest } from "../../core/types.js";
import { assemblePackGated } from "../assemble.js";
import { excavatePack, type RejectedSpec } from "./orchestrate.js";
import { proposeClusters, type ClusterDef } from "./clusters.js";
import { anthropicClient, type ModelClient } from "./model.js";
import { writePack } from "../../pack/writer.js";

/**
 * Cost-control + injection options for one engine compile. `perCluster`/`model`/`clusters`
 * mirror the CLI's `EngineOptions`; `client` is the INJECTED ModelClient (tests pass a stub;
 * the CLI/TUI default to the live `anthropicClient`). Keeping `client` here — not a separate
 * arg — lets every caller go through one door.
 */
export interface EngineCompileOptions {
  /** Target kept nodes per cluster; undefined → engine default (4). Caps model calls → cost. */
  perCluster?: number;
  /** Model id override; undefined → anthropicClient falls back to ADA_MODEL, then default. */
  model?: string;
  /** Explicit area override (skips the model proposal). ROOT/UNK ensured by the caller. */
  clusters?: ClusterDef[];
  /**
   * The model boundary. DEFAULT: `anthropicClient({ model })` (the live compile-time call,
   * A1/A9). Tests inject a stub so no network is touched. This is the ONLY seam through which
   * a network can enter — every other line here is pure orchestration over it.
   */
  client?: ModelClient;
}

export interface EngineCompileResult {
  /** The assembled, on-disk PackModel. */
  model: PackModel;
  /** The manifest the writer produced (counts, clusters, label registry). */
  manifest: PackManifest;
  /**
   * A REAL kept node to land on first — prefers a non-ROOT capsule (an excavated insight, not
   * the synthesized root), falling back to the first node, then "ROOT.000".
   */
  firstNodeId: string;
  /** Candidates the gate refused / dups — for the CLI's audit line. Empty in the happy path. */
  rejected: RejectedSpec[];
}

/**
 * Ensure the structural anchors (ROOT first, UNK last) wrap an explicit area override without
 * duplicating either. Pure. Mirrors `cli.ts`'s `withAnchors` so the override path is identical
 * regardless of which front-end called it.
 */
export function withAnchors(areas: ClusterDef[]): ClusterDef[] {
  const middle = areas.filter((c) => c.code !== "ROOT" && c.code !== "UNK");
  return [
    { code: "ROOT", label: "Context root" },
    ...middle,
    { code: "UNK", label: "Unknown-unknowns" },
  ];
}

/**
 * Run the engine compile end-to-end and land a pack on disk. Returns the model, the manifest,
 * and the first node to open. THROWS a clear error when no candidate clears the gate (so the
 * caller can surface it) — the missing-key case surfaces from `anthropicClient.complete`
 * (model.ts), still through this one seam.
 *
 * Two Seeds, on purpose (mirrors the CLI exactly so behaviour is identical):
 *   • `seed` — DRIVES proposeClusters + excavatePack. Always present (the caller derives it
 *     from the intent via `engineSeed`, or hands the interview's captured Seed).
 *   • `seedOverride` — the ASSEMBLY override (AXIOM A2). When present (interview), the pack's
 *     SEED.md is that verbatim. When ABSENT, `assemblePackGated` DERIVES the pack Seed from
 *     intent + kept nodes — so a bare compile never persists the thin bare-intent Seed.
 */
export async function engineCompile(args: {
  cwd: string;
  slug: string;
  intent: string;
  /** The Seed driving excavation/proposal. Caller derives it or injects the interview's. */
  seed: Seed;
  /** Optional richer Seed used verbatim as the pack's SEED.md (interview path, A2). */
  seedOverride?: Seed;
  opts?: EngineCompileOptions;
}): Promise<EngineCompileResult> {
  const { cwd, slug, intent, seed, seedOverride } = args;
  const opts = args.opts ?? {};

  // --depth caps kept nodes/cluster (≈ caps model calls → caps cost). The model id flows into
  // the DEFAULT client only; an injected `client` (tests) wins and never touches a network.
  const depthOpts = opts.perCluster ? { perCluster: opts.perCluster } : {};
  const clientOpts = opts.model ? { model: opts.model } : {};
  const client = opts.client ?? anthropicClient(clientOpts);

  // Derive DOMAIN-appropriate areas from the Seed (P7). An explicit override skips the model
  // proposal; otherwise `proposeClusters` makes ONE model call and falls back on garbled output.
  const proposed: ClusterDef[] = opts.clusters
    ? withAnchors(opts.clusters)
    : await proposeClusters(seed, client);
  const clusterLabels: Record<string, string> = Object.fromEntries(
    proposed.map((c) => [c.code, c.label]),
  );

  const { kept, rejected } = await excavatePack(
    seed,
    proposed.map((c) => c.code),
    client,
    depthOpts,
  );
  if (kept.length === 0) {
    throw new Error(
      "The engine produced no node that cleared the gate. Every candidate was rejected " +
        "as generic or un-traced. Refine the intent and retry.",
    );
  }

  // `seedOverride` (interview) persists verbatim; absent → assembly DERIVES the pack Seed from
  // intent + kept nodes. Forwarding `undefined` here is exactly what the CLI did (A2).
  const { model } = assemblePackGated(
    slug,
    intent,
    kept,
    seedOverride,
    clusterLabels,
  );
  const manifest = await writePack(cwd, model);

  const firstNodeId =
    model.graph.nodes.find((n) => n.id !== "ROOT.000")?.id ??
    model.graph.nodes[0]?.id ??
    "ROOT.000";

  return { model, manifest, firstNodeId, rejected };
}
