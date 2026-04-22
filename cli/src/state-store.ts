import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

export type StageCode =
  | "CTX"
  | "INT"
  | "PER"
  | "ENT"
  | "PRO"
  | "SYN"
  | "VER"
  | "GOV";

export interface StageSlice {
  readonly stage: StageCode;
  readonly status: "pending" | "running" | "complete" | "failed";
  readonly data: unknown;
  readonly completedAt?: number;
  readonly entropy?: number;
}

export interface StateSnapshot {
  readonly runId: string;
  readonly startedAt: number;
  readonly lastUpdatedAt: number;
  readonly intent: string | null;
  readonly stages: Partial<Record<StageCode, StageSlice>>;
  readonly decision: "ACCEPT" | "REJECT" | "ITERATE" | "PENDING";
  readonly available: boolean;
}

type Listener = (snap: StateSnapshot) => void;

const STATE_DIR = ".ada";
const STATE_FILE = "state.json";

function freshRunId(): string {
  return `run_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

function freshSnapshot(intent: string | null = null): StateSnapshot {
  const now = Date.now();
  return {
    runId: freshRunId(),
    startedAt: now,
    lastUpdatedAt: now,
    intent,
    stages: {},
    decision: "PENDING",
    available: false,
  };
}

function isValidSnapshot(v: unknown): v is StateSnapshot {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.runId === "string" &&
    typeof o.startedAt === "number" &&
    typeof o.lastUpdatedAt === "number" &&
    (o.intent === null || typeof o.intent === "string") &&
    o.stages !== null &&
    typeof o.stages === "object" &&
    typeof o.decision === "string" &&
    typeof o.available === "boolean"
  );
}

export class StateStore {
  private readonly projectDir: string;
  private readonly stateDir: string;
  private readonly statePath: string;
  private current: StateSnapshot;
  private listeners: Listener[] = [];
  private writeChain: Promise<void> = Promise.resolve();

  constructor(projectDir: string) {
    this.projectDir = projectDir;
    this.stateDir = path.join(projectDir, STATE_DIR);
    this.statePath = path.join(this.stateDir, STATE_FILE);
    this.current = freshSnapshot();
  }

  load(): StateSnapshot {
    try {
      if (!fs.existsSync(this.statePath)) {
        this.current = freshSnapshot();
        return this.current;
      }
      const raw = fs.readFileSync(this.statePath, "utf8");
      const parsed = JSON.parse(raw);
      if (!isValidSnapshot(parsed)) {
        process.stderr.write(
          `[state-store] malformed state.json shape, starting fresh\n`,
        );
        this.current = freshSnapshot();
        return this.current;
      }
      this.current = parsed;
      return this.current;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(
        `[state-store] failed to load ${this.statePath}: ${msg}\n`,
      );
      this.current = freshSnapshot();
      return this.current;
    }
  }

  save(snapshot: StateSnapshot): void {
    this.current = snapshot;
    try {
      fs.mkdirSync(this.stateDir, { recursive: true });
    } catch {
      // ignore — writeFileSync below will surface real errors
    }
    const tmpPath = path.join(
      this.stateDir,
      `${STATE_FILE}.tmp-${process.pid}-${crypto.randomBytes(3).toString("hex")}`,
    );
    const payload = JSON.stringify(snapshot, null, 2);
    let fd: number | null = null;
    try {
      fd = fs.openSync(tmpPath, "w");
      fs.writeSync(fd, payload);
      try {
        fs.fsyncSync(fd);
      } catch {
        // fsync may fail on some filesystems; rename is still atomic
      }
      fs.closeSync(fd);
      fd = null;
      fs.renameSync(tmpPath, this.statePath);
    } catch (err) {
      if (fd !== null) {
        try {
          fs.closeSync(fd);
        } catch {
          /* ignore */
        }
      }
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* ignore */
      }
      throw err;
    }
  }

  mergeStage(
    stage: StageCode,
    slice: Omit<StageSlice, "stage">,
  ): StateSnapshot {
    const prev = this.current;
    const full: StageSlice = { stage, ...slice };
    const nextStages: Partial<Record<StageCode, StageSlice>> = {
      ...prev.stages,
      [stage]: full,
    };
    const ctxComplete = nextStages.CTX?.status === "complete";
    let nextDecision = prev.decision;
    if (stage === "GOV" && slice.status === "complete") {
      const d = (slice.data as { decision?: string } | null)?.decision;
      if (d === "ACCEPT" || d === "REJECT" || d === "ITERATE") {
        nextDecision = d;
      }
    }
    const next: StateSnapshot = {
      ...prev,
      stages: nextStages,
      lastUpdatedAt: Date.now(),
      available: prev.available || ctxComplete,
      decision: nextDecision,
    };
    this.save(next);
    for (const fn of [...this.listeners]) {
      try {
        fn(next);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        process.stderr.write(`[state-store] listener error: ${msg}\n`);
      }
    }
    return next;
  }

  getLatest(): StateSnapshot {
    return this.current;
  }

  onUpdate(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => {
      for (let i = this.listeners.length - 1; i >= 0; i--) {
        if (this.listeners[i] === fn) {
          this.listeners.splice(i, 1);
          return;
        }
      }
    };
  }

  startRun(intent: string | null): StateSnapshot {
    const now = Date.now();
    const next: StateSnapshot = {
      runId: freshRunId(),
      startedAt: now,
      lastUpdatedAt: now,
      intent,
      stages: {},
      decision: "PENDING",
      available: false,
    };
    this.save(next);
    return next;
  }
}
