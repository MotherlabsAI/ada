export type GovernorSignal =
  | { readonly type: "CONFIDENCE"; readonly value: number }
  | {
      readonly type: "DRIFT";
      readonly severity: "critical" | "major" | "minor";
      readonly location: string;
      readonly detail: string;
    }
  | {
      readonly type: "POSTCONDITION_FAIL";
      readonly agent: string;
      readonly missing: readonly string[];
    }
  | {
      readonly type: "LOW_CONFIDENCE";
      readonly confidence: number;
      readonly reason: string;
    }
  | {
      readonly type: "CAPABILITY_GAP";
      readonly description: string;
      readonly suggestedAgent: SuggestedAgent;
    }
  | {
      readonly type: "CHECKPOINT";
      readonly sessionId: string;
      readonly timestamp: number;
    }
  | {
      readonly type: "SESSION_COMPLETE";
      readonly finalConfidence: number;
      readonly decision: "ACCEPT" | "DRIFT" | "HALT";
    }
  | {
      readonly type: "SESSION_RELOAD";
      readonly triggeredBy: string;
      readonly artifactsRegenerated: readonly string[];
    }
  | {
      readonly type: "TICK_SUMMARY";
      readonly driftCount: number;
      readonly criticalCount: number;
      readonly confidence: number;
      readonly sessionMs: number;
    };

export interface SuggestedAgent {
  readonly name: string;
  readonly description: string;
  readonly tools: readonly string[];
}

// ─── G3: Session Reload Signal ────────────────────────────────────────────────
// Emitted by ProjectionEngine after artifact regeneration to notify the active
// Claude Code session via MCP that configuration has changed.

export interface SessionReloadSignal {
  readonly type: "SESSION_RELOAD";
  readonly triggeredBy: string;
  readonly artifactsRegenerated: readonly string[];
}
