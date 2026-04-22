// Live-state MCP tools — served by the `ada context` daemon.
//
// These wrap a StateStore snapshot (from cli/src/state-store.ts) and expose
// three read-only tools to MCP clients (notably Claude Code). The snapshot
// fills in progressively as ada compiles: CTX always available immediately,
// INT/PER/ENT/PRO/SYN/VER/GOV landing as each stage finishes.
//
// Keep StageCode + StateSnapshot shape in sync with cli/src/state-store.ts.

export type StageCode =
  | "CTX"
  | "INT"
  | "PER"
  | "ENT"
  | "PRO"
  | "SYN"
  | "VER"
  | "GOV";

export type StageStatus = "pending" | "running" | "complete" | "failed";
export type Decision = "ACCEPT" | "REJECT" | "ITERATE" | "PENDING";

export interface StageSlice {
  readonly stage: StageCode;
  readonly status: StageStatus;
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
  readonly decision: Decision;
  readonly available: boolean;
}

export interface LiveStateReader {
  readonly getSnapshot: () => StateSnapshot | null;
}

export interface ToolResponse {
  readonly content: readonly { readonly type: "text"; readonly text: string }[];
  readonly isError?: boolean;
}

export interface LiveTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: {
    readonly type: "object";
    readonly properties?: Record<string, unknown>;
    readonly required?: readonly string[];
  };
  readonly call: (args: Record<string, unknown>) => ToolResponse;
}

const ORDER: readonly StageCode[] = [
  "CTX",
  "INT",
  "PER",
  "ENT",
  "PRO",
  "SYN",
  "VER",
  "GOV",
];

function wrap(payload: unknown, isError = false): ToolResponse {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    ...(isError ? { isError: true } : {}),
  };
}

function completeStages(snap: StateSnapshot): StageCode[] {
  return ORDER.filter((c) => snap.stages[c]?.status === "complete");
}

function pendingStages(snap: StateSnapshot): StageCode[] {
  return ORDER.filter((c) => {
    const s = snap.stages[c]?.status;
    return s === undefined || s === "pending" || s === "running";
  });
}

export function buildGetAvailableContextTool(reader: LiveStateReader): LiveTool {
  return {
    name: "ada.get_available_context",
    description:
      "Returns every stage slice currently complete, plus available_stages. Fills in progressively as the daemon compiles.",
    inputSchema: { type: "object", properties: {} },
    call(): ToolResponse {
      const snap = reader.getSnapshot();
      if (!snap) {
        return wrap({
          available_stages: [],
          message:
            "No ada run detected yet. The daemon has not produced a state snapshot — start an ada compile or wait a moment.",
        });
      }
      const done = completeStages(snap);
      const payload: Record<string, unknown> = {
        runId: snap.runId,
        available_stages: done,
      };
      if (done.length === 0) {
        payload["message"] =
          "Run initializing. No stages complete yet — project CTX is still being gathered.";
        return wrap(payload);
      }
      for (const code of done) {
        const slice = snap.stages[code];
        if (slice) payload[code.toLowerCase()] = slice.data;
      }
      if (done.length === 1 && done[0] === "CTX") {
        payload["message"] =
          "Project context available. LLM stages pending.";
      } else if (!done.includes("GOV")) {
        payload["message"] = `Partial context: ${done.join(
          ", ",
        )}. Later stages still pending.`;
      } else {
        payload["message"] = "Full blueprint available (ACCEPT reached).";
      }
      return wrap(payload);
    },
  };
}

export function buildGetStageTool(reader: LiveStateReader): LiveTool {
  return {
    name: "ada.get_stage",
    description:
      "Returns a single stage's slice if complete; otherwise { pending: true, reason }. Never throws.",
    inputSchema: {
      type: "object",
      properties: {
        stage: { type: "string", enum: ORDER as unknown as string[] },
      },
      required: ["stage"],
    },
    call(args: Record<string, unknown>): ToolResponse {
      const raw = typeof args["stage"] === "string" ? (args["stage"] as string) : "";
      const code = raw.toUpperCase() as StageCode;
      if (!ORDER.includes(code)) {
        return wrap({
          pending: true,
          reason: `Unknown stage "${raw}". Expected one of ${ORDER.join(", ")}.`,
        });
      }
      const snap = reader.getSnapshot();
      if (!snap) {
        return wrap({
          pending: true,
          reason: "No active ada run. Nothing to read yet.",
        });
      }
      const slice = snap.stages[code];
      if (!slice || slice.status === "pending") {
        return wrap({
          pending: true,
          reason: `Stage ${code} has not started yet.`,
        });
      }
      if (slice.status === "running") {
        return wrap({
          pending: true,
          reason: `Stage ${code} is still running. Try again in a moment.`,
        });
      }
      if (slice.status === "failed") {
        const errMsg =
          (slice.data as { error?: string } | null)?.error ?? "unknown error";
        return wrap({
          pending: true,
          reason: `Stage ${code} failed: ${errMsg}.`,
        });
      }
      return wrap({
        stage: code,
        data: slice.data,
        completedAt: slice.completedAt,
        entropy: slice.entropy,
      });
    },
  };
}

export function buildDescribeRunTool(reader: LiveStateReader): LiveTool {
  return {
    name: "ada.describe_run",
    description:
      "Metadata overview of the current ada run: runId, intent, decision, elapsed, complete vs pending stages. No stage payloads.",
    inputSchema: { type: "object", properties: {} },
    call(): ToolResponse {
      const snap = reader.getSnapshot();
      if (!snap) {
        return wrap({
          active: false,
          message: "No ada run is active in this workspace.",
        });
      }
      return wrap({
        active: snap.available,
        runId: snap.runId,
        intent: snap.intent,
        decision: snap.decision,
        startedAt: snap.startedAt,
        lastUpdatedAt: snap.lastUpdatedAt,
        elapsedMs: Math.max(0, Date.now() - snap.startedAt),
        complete: completeStages(snap),
        pending: pendingStages(snap),
      });
    },
  };
}

export function buildLiveTools(reader: LiveStateReader): readonly LiveTool[] {
  return [
    buildGetAvailableContextTool(reader),
    buildGetStageTool(reader),
    buildDescribeRunTool(reader),
  ];
}
