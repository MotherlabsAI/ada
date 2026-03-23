import React from "react";
import { Text, Box } from "ink";
import { palette, glyphs, formatElapsed } from "./design-system.js";
import {
  useDiamondBreathe,
  useBrailleOrbit,
  useBrailleGrow,
  usePulseDot,
  useVerbRotation,
} from "./hooks.js";
import { ReasoningStream } from "./reasoning-stream.js";
import { Crystallization } from "./crystallization.js";
import { StageArtifact } from "./stage-artifact.js";
import type { CompilerStageCode } from "@ada/compiler";

// ─── Stage metadata ───────────────────────────────────────────────────────────

const STAGE_META: Record<
  CompilerStageCode,
  { name: string; verb: string; question: string }
> = {
  CTX: { name: "CONTEXT", verb: "analyze", question: "what already exists?" },
  INT: { name: "INTENT", verb: "excavate", question: "what do you want?" },
  PER: { name: "PERSONA", verb: "situate", question: "in what world?" },
  ENT: { name: "ENTITY", verb: "crystallize", question: "what things exist?" },
  PRO: { name: "PROCESS", verb: "choreograph", question: "what happens?" },
  SYN: { name: "SYNTHESIS", verb: "compose", question: "how do they fit?" },
  VER: { name: "VERIFY", verb: "challenge", question: "is that right?" },
  GOV: {
    name: "GOVERNOR",
    verb: "govern",
    question: "does this meet the bar?",
  },
};

// ─── Spinner selection by stage ───────────────────────────────────────────────
// INT, PER → brailleOrbit (scanning)
// ENT, SYN → brailleGrow (forming, building density)
// VER      → pulseDot (measuring, probing)
// GOV      → diamondBreathe (deciding, weighing)

function StageSpinner({
  stage,
}: {
  stage: CompilerStageCode;
}): React.ReactElement {
  // All hooks called unconditionally (rules of hooks)
  const orbit = useBrailleOrbit();
  const grow = useBrailleGrow();
  const dot = usePulseDot();
  const diamond = useDiamondBreathe();
  const verb = useVerbRotation(stage);

  const frame =
    stage === "ENT" || stage === "SYN"
      ? grow
      : stage === "VER"
        ? dot
        : stage === "GOV"
          ? diamond
          : orbit;

  return (
    <Text color={palette.accent.primary}>
      {frame} {verb}
      {glyphs.pipeline.ellipsis}
    </Text>
  );
}

// ─── Phase types ──────────────────────────────────────────────────────────────

export type StagePhase = "reasoning" | "crystallizing" | "artifact";

// ─── Stage panel props ────────────────────────────────────────────────────────

interface StagePanelProps {
  readonly stage: CompilerStageCode;
  readonly phase: StagePhase;
  readonly reasoningTokens: string;
  readonly artifact: unknown;
  readonly entropy: number;
  readonly previousEntropy: number;
  readonly elapsedMs: number;
}

// ─── Stage panel ──────────────────────────────────────────────────────────────

export function StagePanel({
  stage,
  phase,
  reasoningTokens,
  artifact,
  entropy,
  previousEntropy,
  elapsedMs,
}: StagePanelProps): React.ReactElement {
  const meta = STAGE_META[stage];
  const entropyDelta = previousEntropy - entropy;

  const entropyColor =
    entropy > 0.7
      ? palette.semantic.failure
      : entropy > 0.4
        ? palette.semantic.warning
        : palette.semantic.verified;

  const borderColor =
    phase === "reasoning"
      ? palette.accent.dim
      : phase === "crystallizing"
        ? palette.accent.primary
        : palette.text.dim;

  return (
    <Box
      borderStyle="single"
      borderColor={borderColor}
      flexDirection="column"
      paddingX={1}
    >
      {/* Header row */}
      <Box justifyContent="space-between">
        <Text color={palette.accent.primary}>
          {"  "}
          {meta.name}{" "}
          <Text color={palette.text.dim}>{glyphs.pipeline.separator}</Text>{" "}
          <Text color={palette.accent.pale}>{meta.verb}</Text>{" "}
          <Text color={palette.text.dim}>{glyphs.pipeline.separator}</Text>{" "}
          <Text color={palette.text.tertiary}>&quot;{meta.question}&quot;</Text>
        </Text>
        {elapsedMs > 0 && (
          <Text color={palette.text.tertiary}>{formatElapsed(elapsedMs)}</Text>
        )}
      </Box>

      <Text>{""}</Text>

      {/* Phase 1: reasoning — stream live tokens */}
      {phase === "reasoning" && (
        <>
          <ReasoningStream tokens={reasoningTokens} maxLines={16} />
          <Text>{""}</Text>
          <Box justifyContent="space-between">
            <StageSpinner stage={stage} />
            <Text color={palette.text.tertiary}>
              {formatElapsed(elapsedMs)}
            </Text>
          </Box>
        </>
      )}

      {/* Phase 2: crystallizing — ◇→◈→◆ transition */}
      {phase === "crystallizing" && (
        <>
          {reasoningTokens.length > 0 && (
            <ReasoningStream tokens={reasoningTokens} maxLines={6} />
          )}
          <Crystallization />
        </>
      )}

      {/* Phase 3: artifact — progressive structured summary */}
      {phase === "artifact" && (
        <StageArtifact stage={stage} artifact={artifact} />
      )}

      <Text>{""}</Text>

      {/* Entropy footer */}
      <Box>
        <Text color={palette.text.dim}>{"  "}</Text>
        <Text color={palette.text.tertiary}>entropy </Text>
        <Text color={entropyColor}>
          {previousEntropy.toFixed(2)} {glyphs.pipeline.arrow}{" "}
          {entropy.toFixed(2)}
          {entropyDelta > 0.001 ? (
            <Text color={palette.semantic.verified}>
              {" "}
              {glyphs.downArrow}
              {entropyDelta.toFixed(2)}
            </Text>
          ) : null}
        </Text>
      </Box>
    </Box>
  );
}
