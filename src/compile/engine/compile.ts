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
import { proposeActions, PLAN_CLUSTER } from "./plan.js";
import { normalizeIntent } from "./normalize.js";
import {
  defaultModelClient,
  newUsageMeter,
  type ModelClient,
  type UsageMeter,
} from "./model.js";
import { writePack } from "../../pack/writer.js";
import {
  ProgressRecorder,
  type PhaseId,
  type ProgressSink,
} from "./progress.js";

/**
 * Cost-control + injection options for one engine compile. `perCluster`/`model`/`clusters`
 * mirror the CLI's `EngineOptions`; `client` is the INJECTED ModelClient (tests pass a stub;
 * the CLI/TUI default to the live `anthropicClient`). Keeping `client` here — not a separate
 * arg — lets every caller go through one door.
 */
export interface EngineCompileOptions {
  /** Target kept nodes per cluster; undefined → engine default (4). Caps model calls → cost. */
  perCluster?: number;
  /** Model id override; undefined → the client falls back to ADA_MODEL, then its default. */
  model?: string;
  /**
   * Force the model PROVIDER: "claude-code" (borrow the Claude Code subscription via the local
   * `claude` CLI — no API key) or "api" (the direct Messages API with ANTHROPIC_API_KEY). Undefined
   * → `resolveProvider` decides (prefers the subscription when `claude` is on PATH). A9: still one
   * compile-time call, just through a different door.
   */
  provider?: string;
  /** Explicit area override (skips the model proposal). ROOT/UNK ensured by the caller. */
  clusters?: ClusterDef[];
  /**
   * Run the INTENT-NORMALIZATION front-end first: ONE model call that expands a thin/vague
   * intent into a rich Seed (domain inferred, unknowns surfaced) before proposal/excavation.
   * This is what lets a non-expert's five words excavate as well as an expert's paragraph.
   * Skipped when a `seedOverride` (the interview) already captured a rich Seed. Default off so
   * stubbed-client tests are unchanged; the live CLI/TUI turn it on.
   */
  normalize?: boolean;
  /**
   * Run the PLANNER pass after excavation: ONE model call that reads the goal + the excavated
   * world and emits gated Action nodes (the moves from current repo → goal), so the POM gets an
   * `execution_plan`, not just a constraint atlas. Each action is gated by the same rubric (A3)
   * and traced to the gap it closes (A2). Off by default so stubbed-client tests are unchanged;
   * the live CLI/TUI turn it on. A non-array model response adds nothing (degrades cleanly).
   */
  plan?: boolean;
  /**
   * The model boundary. DEFAULT: `anthropicClient({ model })` (the live compile-time call,
   * A1/A9). Tests inject a stub so no network is touched. This is the ONLY seam through which
   * a network can enter — every other line here is pure orchestration over it.
   */
  client?: ModelClient;
  /**
   * Real-time progress sink. The engine ALWAYS records progress to `.compile-progress.json` in
   * the pack dir (so `ada watch <slug>` works unconditionally); this optional sink is an extra
   * fan-out — e.g. a TUI/state setter — called with each raw event. Off by default; no behavior
   * change when absent (stub tests unaffected).
   */
  onProgress?: ProgressSink;
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
  /** The compile's spend: calls, tokens, cache, cost. Zeroed when a stub client is injected. */
  usage: UsageMeter;
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
  // The spend meter: the real client folds each call's tokens + cost in; an injected stub leaves
  // it zero (no network, no spend). Returned in the result so the CLI/agent can report cost.
  const meter = newUsageMeter();
  const client =
    opts.client ??
    defaultModelClient({
      meter,
      ...(opts.model ? { model: opts.model } : {}),
      ...(opts.provider ? { provider: opts.provider } : {}),
    });

  // THE REAL-TIME SPINE. The recorder folds the engine's event stream into one snapshot and
  // writes `.compile-progress.json` after every event, so `ada watch <slug>` (and the /ada skill
  // loop) can see the compile run. It refreshes token/cost totals from `meter` on each emit, and
  // fans every raw event out to `opts.onProgress` when present. Best-effort: it never throws.
  const now = (): string => new Date().toISOString();
  const rec = new ProgressRecorder({
    cwd,
    slug,
    intent,
    now: now(),
    meter,
    ...(opts.onProgress ? { onEvent: opts.onProgress } : {}),
  });
  const emit = (e: Parameters<ProgressSink>[0]): void => rec.emit(e, now());
  let phase: PhaseId = "normalize";

  try {
    // INTENT FRONT-END: expand a thin intent into a rich Seed before anything downstream — so a
    // non-expert's vague sentence excavates like an expert's spec. Skipped when the interview
    // (`seedOverride`) already captured a rich Seed; off by default (stub tests unaffected).
    let drivingSeed: Seed = seed;
    if (opts.normalize && !seedOverride) {
      phase = "normalize";
      emit({ kind: "phase_start", phase, callsTotal: 1 });
      emit({ kind: "call", phase });
      drivingSeed = await normalizeIntent(intent, seed, client);
      emit({ kind: "phase_done", phase });
    }

    // Derive DOMAIN-appropriate areas from the Seed (P7). An explicit override skips the model
    // proposal; otherwise `proposeClusters` makes ONE model call and falls back on garbled output.
    let proposed: ClusterDef[];
    if (opts.clusters) {
      proposed = withAnchors(opts.clusters);
    } else {
      phase = "propose";
      emit({ kind: "phase_start", phase, callsTotal: 1 });
      emit({ kind: "call", phase });
      proposed = await proposeClusters(drivingSeed, client);
      emit({ kind: "phase_done", phase });
    }
    const clusterLabels: Record<string, string> = Object.fromEntries(
      proposed.map((c) => [c.code, c.label]),
    );

    phase = "excavate";
    emit({ kind: "phase_start", phase });
    const { kept, rejected } = await excavatePack(
      drivingSeed,
      proposed.map((c) => c.code),
      client,
      depthOpts,
      emit,
    );
    emit({ kind: "phase_done", phase });
    if (kept.length === 0) {
      throw new Error(
        "The engine produced no node that cleared the gate. Every candidate was rejected " +
          "as generic or un-traced. Refine the intent and retry.",
      );
    }

    // PLANNER pass (opt-in): turn the described world into a plan. ONE model call → gated Action
    // nodes (the moves from current repo → goal), merged under the PLAN cluster so the POM's
    // execution_plan populates. Traced to gaps (A2), gated by the same rubric (A3); a non-array
    // response adds nothing. Runs only when a planning move exists (≥1 kept world node to act on).
    let allNodes = kept;
    if (opts.plan) {
      phase = "plan";
      emit({ kind: "phase_start", phase, callsTotal: 1 });
      emit({ kind: "call", phase });
      const { actions, rejected: planRejected } = await proposeActions(
        drivingSeed,
        kept,
        client,
      );
      if (actions.length) {
        allNodes = [...kept, ...actions];
        clusterLabels[PLAN_CLUSTER] = "Plan / next moves";
      }
      rejected.push(...planRejected);
      emit({ kind: "phase_done", phase });
    }

    // `seedOverride` (interview) persists verbatim; absent → assembly DERIVES the pack Seed from
    // intent + kept nodes. Forwarding `undefined` here is exactly what the CLI did (A2).
    phase = "assemble";
    emit({ kind: "phase_start", phase });
    const { model } = assemblePackGated(
      slug,
      intent,
      allNodes,
      seedOverride,
      clusterLabels,
    );
    emit({ kind: "phase_done", phase });

    phase = "write";
    emit({ kind: "phase_start", phase });
    const manifest = await writePack(cwd, model);
    emit({ kind: "phase_done", phase });
    emit({ kind: "residue", count: manifest.residueCount ?? 0 });

    const firstNodeId =
      model.graph.nodes.find((n) => n.id !== "ROOT.000")?.id ??
      model.graph.nodes[0]?.id ??
      "ROOT.000";

    emit({ kind: "done" });
    return { model, manifest, firstNodeId, rejected, usage: meter };
  } catch (err) {
    // Record the failure into the snapshot (status:"error") so a watcher sees WHY it stopped,
    // then re-throw — the spine observes; it does not swallow the engine's contract.
    emit({
      kind: "error",
      phase,
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
