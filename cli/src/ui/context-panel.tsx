import React, { useEffect, useState } from "react";
import { Box, Text, render } from "ink";
import { palette, glyphs, formatElapsed } from "./design-system.js";
import type { StageCode, StageSlice, StateSnapshot } from "../state-store.js";

// ═══════════════════════════════════════════════════════════════════════════════
// ADA CONTEXT PANEL — live status for the `ada context` daemon
// ═══════════════════════════════════════════════════════════════════════════════

export interface ContextPanelProps {
  readonly snapshot: StateSnapshot;
  readonly mcpStatus: "starting" | "running" | "stopped" | "error";
  readonly lastQueryAt: number | null;
  readonly compileRunning: boolean;
  readonly startedAt: number;
}

const STAGE_ORDER: readonly StageCode[] = [
  "CTX", "INT", "PER", "ENT", "PRO", "SYN", "VER", "GOV",
] as const;

const RUNNING_DOTS = ["▪", "▪▪", "▪▪▪", "▪▪▪▪", "▪▪▪▪▪", "▪▪▪▪▪▪"] as const;

const MCP_DISPLAY: Record<
  ContextPanelProps["mcpStatus"],
  { color: string; label: string; glyph: string }
> = {
  starting: {
    color: palette.semantic.warning,
    label: "starting",
    glyph: glyphs.status.loading,
  },
  running: {
    color: palette.semantic.verified,
    label: "running on stdio",
    glyph: glyphs.status.connected,
  },
  stopped: {
    color: palette.text.tertiary,
    label: "stopped",
    glyph: glyphs.status.disconnected,
  },
  error: {
    color: palette.semantic.failure,
    label: "error",
    glyph: glyphs.status.fail,
  },
};

// ─── Stage row ────────────────────────────────────────────────────────────────

function StageRow({
  code,
  slice,
  tick,
}: {
  code: StageCode;
  slice: StageSlice | undefined;
  tick: number;
}): React.ReactElement {
  const status = slice?.status ?? "pending";

  if (status === "complete") {
    const entropy = typeof slice?.entropy === "number" ? slice.entropy : null;
    return (
      <Box>
        <Text color={palette.semantic.verified}>{"    " + glyphs.identity.filled}</Text>
        <Text color={palette.text.primary}>{" " + code + "   "}</Text>
        <Text color={palette.semantic.verified}>complete</Text>
        {entropy !== null && (
          <Text color={palette.text.dim}>{"   entropy " + entropy.toFixed(2)}</Text>
        )}
      </Box>
    );
  }

  if (status === "running") {
    const dots = RUNNING_DOTS[tick % RUNNING_DOTS.length];
    return (
      <Box>
        <Text color={palette.semantic.active}>{"    " + glyphs.identity.filled}</Text>
        <Text color={palette.text.primary}>{" " + code + "   "}</Text>
        <Text color={palette.semantic.active}>{"running     " + dots}</Text>
      </Box>
    );
  }

  if (status === "failed") {
    return (
      <Box>
        <Text color={palette.semantic.failure}>{"    " + glyphs.identity.filled}</Text>
        <Text color={palette.text.primary}>{" " + code + "   "}</Text>
        <Text color={palette.semantic.failure}>{glyphs.status.fail + " failed"}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text color={palette.text.dim}>{"    " + glyphs.identity.open}</Text>
      <Text color={palette.text.tertiary}>{" " + code + "   "}</Text>
      <Text color={palette.text.dim}>pending</Text>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ContextPanel(props: ContextPanelProps): React.ReactElement {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedLabel = formatElapsed(Math.max(0, Date.now() - props.startedAt));
  const lastQueryLabel =
    props.lastQueryAt === null
      ? "never"
      : formatElapsed(Math.max(0, Date.now() - props.lastQueryAt)) + " ago";

  const decision = props.snapshot.decision;
  const decisionColor =
    decision === "ACCEPT"
      ? palette.semantic.verified
      : decision === "REJECT"
        ? palette.semantic.failure
        : decision === "ITERATE"
          ? palette.semantic.warning
          : palette.text.tertiary;

  const mcp = MCP_DISPLAY[props.mcpStatus];
  void tick; // re-render driver

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box
        borderStyle="round"
        borderColor={palette.accent.dim}
        flexDirection="column"
        paddingX={1}
      >
        <Box justifyContent="space-between">
          <Text color={palette.accent.primary}>{glyphs.identity.core + " ada context"}</Text>
          <Text color={palette.text.secondary}>{elapsedLabel}</Text>
        </Box>

        <Text color={palette.text.secondary}>{"\n  PIPELINE"}</Text>
        {STAGE_ORDER.map((code) => (
          <StageRow
            key={code}
            code={code}
            slice={props.snapshot.stages[code]}
            tick={tick}
          />
        ))}

        <Box marginTop={1}>
          <Text color={palette.text.secondary}>{"  MCP        "}</Text>
          <Text color={mcp.color}>{mcp.glyph + " " + mcp.label}</Text>
        </Box>
        <Box>
          <Text color={palette.text.secondary}>{"  last query "}</Text>
          <Text color={palette.text.primary}>{lastQueryLabel}</Text>
        </Box>
        <Box>
          <Text color={palette.text.secondary}>{"  decision   "}</Text>
          <Text color={decisionColor}>{decision}</Text>
        </Box>
        {props.compileRunning && (
          <Box>
            <Text color={palette.semantic.active}>
              {"  " + glyphs.pipeline.cycle + " compile in progress"}
            </Text>
          </Box>
        )}
      </Box>

      <Text color={palette.text.dim}>
        {"  run "}
        <Text color={palette.text.tertiary}>{props.snapshot.runId}</Text>
      </Text>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPERATIVE MOUNT HELPER
// ═══════════════════════════════════════════════════════════════════════════════

function Host({ getProps }: { getProps: () => ContextPanelProps }): React.ReactElement {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <ContextPanel {...getProps()} />;
}

export function mountContextPanel(
  getProps: () => ContextPanelProps,
): () => void {
  const instance = render(React.createElement(Host, { getProps }));
  return () => {
    try {
      instance.unmount();
    } catch {
      // already unmounted
    }
  };
}
