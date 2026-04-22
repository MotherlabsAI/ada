import React, { useEffect, useState } from "react";
import { Text, Box } from "ink";
import {
  palette,
  glyphs,
  formatElapsed,
  confidenceColor,
} from "./design-system.js";
import { useElapsed } from "./hooks.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActivityEvent {
  ts: number;
  kind: "tool" | "content" | "drift" | "checkpoint";
  label: string;
  detail: string;
}

export interface RunState {
  projectDecision: string | null;
  projectConfidence: number;
  cwd: string;
  sessionStart: number;
  events: ActivityEvent[];
  driftCount: number;
  criticalCount: number;
  confidence: number;
  lastTickMs: number | null;
  sessionComplete: boolean;
  finalDecision: string | null;
  eventCount: number;
  // Context panel
  blueprintSummary: string | null;
  topEntities: string[];
  totalSessions: number;
  avgConfidence: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function confidenceBar(confidence: number): string {
  const filled = Math.round(confidence * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

function decisionColor(decision: string | null): string {
  if (decision === "ACCEPT") return palette.semantic.verified;
  if (decision === "REJECT" || decision === "HALT")
    return palette.semantic.failure;
  if (decision === "DRIFT") return palette.semantic.warning;
  return palette.text.secondary;
}

function divider(label: string): string {
  const prefix = `┄┄ ${label} `;
  const totalWidth = 57;
  const remaining = Math.max(0, totalWidth - prefix.length);
  return prefix + "┄".repeat(remaining);
}

function shortPath(cwd: string): string {
  const home = process.env["HOME"] ?? "";
  if (home && cwd.startsWith(home)) {
    return "~" + cwd.slice(home.length);
  }
  return cwd;
}

// ─── Activity row ─────────────────────────────────────────────────────────────

function ActivityRow({ event }: { event: ActivityEvent }): React.ReactElement {
  const isDrift = event.kind === "drift";
  const isCheckpoint = event.kind === "checkpoint";
  const isContent = event.kind === "content";

  const iconColor = isDrift
    ? palette.semantic.warning
    : isCheckpoint
      ? palette.semantic.verified
      : palette.accent.primary;

  const icon = isDrift
    ? glyphs.status.alert
    : isCheckpoint
      ? glyphs.status.pass
      : isContent
        ? glyphs.identity.core
        : "▸";

  const labelColor = isDrift
    ? palette.semantic.warning
    : isContent
      ? palette.text.secondary
      : palette.text.primary;

  const labelWidth = 12;
  const paddedLabel = event.label.slice(0, labelWidth).padEnd(labelWidth, " ");

  return (
    <Box>
      <Text color={iconColor}>
        {"  "}
        {icon}
        {"  "}
      </Text>
      <Text color={labelColor}>{paddedLabel}</Text>
      <Text color={palette.text.secondary}>{"  "}</Text>
      <Text color={palette.text.tertiary}>{event.detail}</Text>
    </Box>
  );
}

// ─── Context panel ───────────────────────────────────────────────────────────

function ContextPanel({ state }: { state: RunState }): React.ReactElement {
  const { blueprintSummary, topEntities, totalSessions, avgConfidence } = state;

  const summaryLine = blueprintSummary
    ? blueprintSummary.slice(0, 54) + (blueprintSummary.length > 54 ? "…" : "")
    : null;

  return (
    <Box flexDirection="column">
      {summaryLine && (
        <Box>
          <Text color={palette.text.dim}>{"  "}</Text>
          <Text color={palette.text.tertiary}>{summaryLine}</Text>
        </Box>
      )}
      {topEntities.length > 0 && (
        <Box>
          <Text color={palette.text.dim}>{"  entities  "}</Text>
          <Text color={palette.text.secondary}>
            {topEntities.slice(0, 4).join("  ·  ")}
          </Text>
        </Box>
      )}
      {totalSessions > 0 && (
        <Box>
          <Text color={palette.text.dim}>{"  history   "}</Text>
          <Text color={palette.text.secondary}>
            {totalSessions} session{totalSessions === 1 ? "" : "s"}
          </Text>
          <Text color={palette.text.dim}>{"  ·  avg "}</Text>
          <Text color={confidenceColor(avgConfidence)}>
            {Math.round(avgConfidence * 100)}
            {"% confidence"}
          </Text>
        </Box>
      )}
    </Box>
  );
}

// ─── No-blueprint screen ──────────────────────────────────────────────────────

function NoBlueprintScreen({
  elapsedMs,
  eventCount,
}: {
  elapsedMs: number;
  eventCount: number;
}): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={2}>
      <Box>
        <Text color={palette.accent.primary}>
          {glyphs.identity.filled} ada run
        </Text>
        <Text color={palette.text.dim}>{"  ·  no blueprint"}</Text>
      </Box>
      <Text> </Text>
      <Box>
        <Text color={palette.text.secondary}>
          {glyphs.identity.core}
          {"  launching claude code without governance"}
        </Text>
      </Box>
      <Box>
        <Text color={palette.text.secondary}>
          {glyphs.identity.core}
          {"  run ada compile first to enable drift detection"}
        </Text>
      </Box>
      <Text> </Text>
      <Text color={palette.text.dim}>
        {"  (events stream silently)"}
        {eventCount > 0
          ? `  ·  ${eventCount} events  ·  ${formatElapsed(elapsedMs)}`
          : ""}
      </Text>
    </Box>
  );
}

// ─── Complete screen ──────────────────────────────────────────────────────────

function CompleteScreen({ state }: { state: RunState }): React.ReactElement {
  const elapsedMs = Date.now() - state.sessionStart;
  const pct = Math.round(state.confidence * 100);
  const decision = state.finalDecision;
  const dColor = decisionColor(decision);

  return (
    <Box flexDirection="column" paddingX={2}>
      <Box>
        <Text color={palette.accent.primary}>
          {glyphs.identity.filled} ada run
        </Text>
        <Text color={palette.text.dim}>
          {"  ·  session complete  ──────  "}
        </Text>
        {decision && (
          <Text color={dColor}>
            {decision}
            {"  "}
            {pct}
            {"% "}
          </Text>
        )}
        <Text color={palette.text.dim}>
          {"·  "}
          {formatElapsed(elapsedMs)}
        </Text>
      </Box>
      <Text> </Text>
      <Box>
        <Text color={palette.text.secondary}>
          {glyphs.identity.core}
          {"  "}
          {state.eventCount} events
          {"  ·  "}
          {state.driftCount} drift signal{state.driftCount === 1 ? "" : "s"}
          {"  ·  "}
          {state.criticalCount} critical
        </Text>
      </Box>
      <Box>
        <Text color={palette.text.secondary}>
          {glyphs.identity.core}
          {"  world model updated"}
        </Text>
      </Box>
    </Box>
  );
}

// ─── Main run screen ──────────────────────────────────────────────────────────

export function RunScreen({ state }: { state: RunState }): React.ReactElement {
  // Force re-renders every 100ms so the elapsed timer stays live.
  // State is mutated externally; this drives the render cycle.
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const elapsedMs = Date.now() - state.sessionStart;

  // Complete screen
  if (state.sessionComplete) {
    return <CompleteScreen state={state} />;
  }

  // No-blueprint passthrough
  const hasBlueprint =
    state.projectDecision !== null || state.projectConfidence > 0;
  if (!hasBlueprint) {
    return (
      <NoBlueprintScreen elapsedMs={elapsedMs} eventCount={state.eventCount} />
    );
  }

  const pct = Math.round(state.confidence * 100);
  const bar = confidenceBar(state.confidence);
  const confColor = confidenceColor(state.confidence);
  const projDecision = state.projectDecision;
  const projPct = Math.round(state.projectConfidence * 100);
  const projColor = decisionColor(projDecision);

  return (
    <Box flexDirection="column" paddingX={2}>
      {/* Header */}
      <Box>
        <Text color={palette.accent.primary}>
          {glyphs.identity.filled} ada run
        </Text>
        <Text color={palette.text.dim}>{"  ·  watching session  "}</Text>
        <Text color={palette.text.dim}>{"──────────────────────────  "}</Text>
        <Text color={palette.text.secondary}>{formatElapsed(elapsedMs)}</Text>
      </Box>

      <Text> </Text>

      {/* Blueprint status */}
      <Box>
        <Text color={palette.text.tertiary}>{"blueprint  "}</Text>
        {projDecision && (
          <Text color={projColor}>
            {projDecision}
            {"  "}
          </Text>
        )}
        <Text color={palette.text.secondary}>
          {projPct}
          {"%"}
        </Text>
        <Text color={palette.text.dim}>{"  ·  "}</Text>
        <Text color={palette.text.tertiary}>{shortPath(state.cwd)}</Text>
      </Box>

      <Text> </Text>

      {/* Context panel */}
      <ContextPanel state={state} />

      <Text> </Text>

      {/* Activity divider */}
      <Text color={palette.text.dim}>{divider("activity")}</Text>
      <Text> </Text>

      {/* Event feed — last 8, newest first */}
      {state.events.length === 0 ? (
        <Box>
          <Text color={palette.text.dim}>
            {"  "}
            {glyphs.identity.core}
            {"  waiting for activity…"}
          </Text>
        </Box>
      ) : (
        state.events
          .slice(0, 8)
          .map((evt, i) => <ActivityRow key={`${evt.ts}-${i}`} event={evt} />)
      )}

      <Text> </Text>

      {/* Governor divider */}
      <Text color={palette.text.dim}>{divider("governor")}</Text>
      <Text> </Text>

      {/* Governor metrics */}
      <Box>
        <Text color={palette.text.tertiary}>{"confidence  "}</Text>
        <Text color={confColor}>
          {bar}
          {"  "}
          {pct}
          {"%"}
        </Text>
        <Text color={palette.text.dim}>{"   drift  "}</Text>
        <Text
          color={
            state.driftCount > 0
              ? palette.semantic.warning
              : palette.text.secondary
          }
        >
          {state.driftCount}
        </Text>
        <Text color={palette.text.dim}>{"  ("}</Text>
        <Text
          color={
            state.criticalCount > 0
              ? palette.semantic.failure
              : palette.text.dim
          }
        >
          {state.criticalCount} critical
        </Text>
        <Text color={palette.text.dim}>{")"}</Text>
      </Box>

      <Text> </Text>

      {/* Bottom divider */}
      <Text color={palette.text.dim}>{"┄".repeat(57)}</Text>

      <Text> </Text>

      {/* Footer */}
      <Box>
        <Text color={palette.text.dim}>{"^C  stop    "}</Text>
        <Text color={palette.text.secondary}>{state.eventCount} events</Text>
        <Text color={palette.text.dim}>{" · "}</Text>
        <Text color={palette.text.secondary}>{formatElapsed(elapsedMs)}</Text>
      </Box>
    </Box>
  );
}

// ─── Helpers for run.ts ───────────────────────────────────────────────────────

/** Push an activity event, keeping at most 8, newest first. */
export function addActivityEvent(
  state: RunState,
  evt: Omit<ActivityEvent, "ts">,
): void {
  state.events.unshift({ ts: Date.now(), ...evt });
  if (state.events.length > 8) {
    state.events.length = 8;
  }
}
