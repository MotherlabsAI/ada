/**
 * progress.ts — the real-time spine for an engine compile.
 *
 * `engineCompile` is otherwise opaque: it runs propose → excavate → assemble → write
 * synchronously and reports nothing until it returns. This module makes the run WATCHABLE.
 *
 * The seam is a single `ProgressSink` — a `(event) => void` the engine calls at every phase
 * boundary, per excavated cluster, and per kept node. A `ProgressRecorder` folds that event
 * stream into one `CompileSnapshot` and writes it atomically to `.compile-progress.json` in the
 * pack dir after every event, plus appends the raw event to `.compile-progress.jsonl`. A watcher
 * (`ada watch <slug>`, the `/ada` skill loop) reads the snapshot; the jsonl is the replay trail.
 *
 * Crash/staleness contract: the snapshot's `status` reflects reality — it stays `running` if the
 * process dies mid-compile, and `updatedAt` lets a reader detect a stale (abandoned) run. The
 * recorder never throws into the compile: a write failure is swallowed (observability must not
 * break the thing it observes). No network here — this is pure local IO (A1/A9: only model.ts
 * may touch a network; this file holds no network token).
 */
import { writeFileSync, renameSync, appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { UsageMeter } from "./model.js";

/** The phases of an engine compile, in run order. `normalize`/`plan` are opt-in. */
export type PhaseId =
  | "normalize"
  | "propose"
  | "excavate"
  | "plan"
  | "assemble"
  | "write";

const PHASE_LABEL: Record<PhaseId, string> = {
  normalize: "normalize intent",
  propose: "propose clusters",
  excavate: "excavate",
  plan: "plan next moves",
  assemble: "assemble pack",
  write: "write to disk",
};

/** The event seam. Every discriminant carries exactly what the recorder needs to fold it in. */
export type ProgressEvent =
  | { kind: "phase_start"; phase: PhaseId; callsTotal?: number }
  | { kind: "phase_done"; phase: PhaseId }
  | { kind: "cluster_start"; cluster: string; callsTotal: number }
  | { kind: "cluster_done"; cluster: string }
  | { kind: "call"; phase: PhaseId; cluster?: string }
  | {
      kind: "node_added";
      cluster: string;
      id: string;
      label: string;
      truth: string;
    }
  | { kind: "residue"; count: number }
  // The FINAL counts from the written manifest (true pack totals, not excavate-phase partials).
  // Freezes totals.nodes/edges/residue at their authoritative values for the done snapshot.
  | { kind: "totals"; nodes: number; edges: number; residue: number }
  | { kind: "done" }
  | { kind: "error"; phase: PhaseId; message: string };

/** A `(event) => void` the engine calls. Recorder.emit IS one; callers may also pass their own. */
export type ProgressSink = (event: ProgressEvent) => void;

export interface ClusterProgress {
  id: string;
  status: "queued" | "running" | "done";
  calls: number;
  callsTotal: number;
  nodes: number;
}

export interface PhaseProgress {
  id: PhaseId;
  label: string;
  status: "running" | "done";
  calls: number;
  callsTotal?: number;
  nodes: number;
  /** Present only on the `excavate` phase: the per-cluster breakdown (the "agents"). */
  clusters?: ClusterProgress[];
}

export interface ProgressTotals {
  nodes: number;
  edges: number;
  residue: number;
  calls: number;
  inTok: number;
  outTok: number;
  cacheTok: number;
  costUsd: number;
}

export interface CompileSnapshot {
  slug: string;
  intent: string;
  status: "running" | "done" | "error";
  startedAt: string;
  updatedAt: string;
  /** The phase currently running (or the last one, once done). */
  phase: PhaseId | null;
  phases: PhaseProgress[];
  totals: ProgressTotals;
  lastError: string | null;
}

function emptyTotals(): ProgressTotals {
  return {
    nodes: 0,
    edges: 0,
    residue: 0,
    calls: 0,
    inTok: 0,
    outTok: 0,
    cacheTok: 0,
    costUsd: 0,
  };
}

export interface RecorderInit {
  cwd: string;
  slug: string;
  intent: string;
  /** ISO timestamp for the run start — injected so callers (and tests) stay deterministic. */
  now: string;
  /** The live spend accumulator; token/cost totals are refreshed from it on every event. */
  meter: UsageMeter;
  /** An optional second sink (e.g. a TUI/state setter) called with the raw event after folding. */
  onEvent?: ProgressSink;
}

/**
 * Folds the engine's event stream into one snapshot and persists it after every event.
 * `emit` is the `ProgressSink` the engine calls. Construction writes the initial `running`
 * snapshot so a watcher attaching immediately sees a live run.
 */
export class ProgressRecorder {
  private snap: CompileSnapshot;
  private readonly dir: string;
  private readonly jsonPath: string;
  private readonly logPath: string;
  private readonly meter: UsageMeter;
  private readonly onEvent: ProgressSink | undefined;

  constructor(init: RecorderInit) {
    this.dir = join(init.cwd, ".ada", "packs", init.slug);
    this.jsonPath = join(this.dir, ".compile-progress.json");
    this.logPath = join(this.dir, ".compile-progress.jsonl");
    this.meter = init.meter;
    this.onEvent = init.onEvent;
    this.snap = {
      slug: init.slug,
      intent: init.intent,
      status: "running",
      startedAt: init.now,
      updatedAt: init.now,
      phase: null,
      phases: [],
      totals: emptyTotals(),
      lastError: null,
    };
    this.persist(init.now);
  }

  /** The sink to hand the engine. Folds the event, refreshes totals, persists, and fans out. */
  emit = (event: ProgressEvent, now?: string): void => {
    const stamp = now ?? this.snap.updatedAt;
    this.fold(event);
    this.refreshTotals();
    this.persist(stamp, event);
    try {
      this.onEvent?.(event);
    } catch {
      // a downstream sink must never break the compile it observes.
    }
  };

  snapshot(): CompileSnapshot {
    return this.snap;
  }

  private phase(id: PhaseId): PhaseProgress {
    let p = this.snap.phases.find((x) => x.id === id);
    if (!p) {
      p = { id, label: PHASE_LABEL[id], status: "running", calls: 0, nodes: 0 };
      this.snap.phases.push(p);
    }
    return p;
  }

  private cluster(p: PhaseProgress, id: string): ClusterProgress {
    p.clusters ??= [];
    let c = p.clusters.find((x) => x.id === id);
    if (!c) {
      c = { id, status: "queued", calls: 0, callsTotal: 0, nodes: 0 };
      p.clusters.push(c);
    }
    return c;
  }

  private fold(e: ProgressEvent): void {
    switch (e.kind) {
      case "phase_start": {
        const p = this.phase(e.phase);
        p.status = "running";
        if (e.callsTotal !== undefined) p.callsTotal = e.callsTotal;
        this.snap.phase = e.phase;
        break;
      }
      case "phase_done": {
        this.phase(e.phase).status = "done";
        break;
      }
      case "cluster_start": {
        const c = this.cluster(this.phase("excavate"), e.cluster);
        c.status = "running";
        c.callsTotal = e.callsTotal;
        break;
      }
      case "cluster_done": {
        this.cluster(this.phase("excavate"), e.cluster).status = "done";
        break;
      }
      case "call": {
        const p = this.phase(e.phase);
        p.calls++;
        if (e.cluster) this.cluster(p, e.cluster).calls++;
        break;
      }
      case "node_added": {
        const p = this.phase("excavate");
        p.nodes++;
        this.cluster(p, e.cluster).nodes++;
        break;
      }
      case "residue": {
        this.snap.totals.residue = e.count;
        break;
      }
      case "totals": {
        this.snap.totals.nodes = e.nodes;
        this.snap.totals.edges = e.edges;
        this.snap.totals.residue = e.residue;
        this.finalized = true; // stop deriving nodes from the excavate phase; these are authoritative
        break;
      }
      case "done": {
        this.snap.status = "done";
        break;
      }
      case "error": {
        this.snap.status = "error";
        this.snap.lastError = `${e.phase}: ${e.message}`;
        break;
      }
    }
  }

  private finalized = false;

  /**
   * Token/cost/call totals always track the meter. While running, node count is the live
   * excavate-phase tally; once a `totals` event finalizes the pack, node/edge/residue counts are
   * the authoritative manifest values and are no longer overwritten by the running estimate.
   */
  private refreshTotals(): void {
    const t = this.snap.totals;
    t.calls = this.meter.calls;
    t.inTok = this.meter.inputTokens;
    t.outTok = this.meter.outputTokens;
    t.cacheTok = this.meter.cacheReadTokens;
    t.costUsd = this.meter.costUsd;
    if (!this.finalized) {
      const exc = this.snap.phases.find((p) => p.id === "excavate");
      t.nodes = exc?.nodes ?? 0;
    }
  }

  private persist(now: string, event?: ProgressEvent): void {
    this.snap.updatedAt = now;
    try {
      mkdirSync(this.dir, { recursive: true });
      const json = JSON.stringify(this.snap, null, 2);
      const tmp = `${this.jsonPath}.tmp`;
      writeFileSync(tmp, json);
      renameSync(tmp, this.jsonPath); // atomic swap — a reader never sees a half-written file
      if (event) {
        appendFileSync(
          this.logPath,
          `${JSON.stringify({ at: now, ...event })}\n`,
        );
      }
    } catch {
      // Observability is best-effort: a failed write must never abort the compile.
    }
  }
}
