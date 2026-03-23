import React from "react";
import { Text, Box, render } from "ink";
import { palette, glyphs, formatElapsed } from "./design-system.js";
import { useElapsed, useTypewriter } from "./hooks.js";
import { DiamondProgressBar } from "./progress-bar.js";
import { EntropyBar } from "./entropy-bar.js";
import { StagePanel, type StagePhase } from "./stage-panel.js";
import { ArtifactList, type ArtifactEntry } from "./artifact-list.js";
import { Crystallization } from "./crystallization.js";
import type { CompilerStageCode, GovernorDecision } from "@ada/compiler";

export const STAGE_ORDER: CompilerStageCode[] = [
  "INT",
  "PER",
  "ENT",
  "PRO",
  "SYN",
  "VER",
  "GOV",
];

// ─── State for each stage ─────────────────────────────────────────────────────

interface StageState {
  phase: StagePhase;
  reasoningTokens: string;
  artifact: unknown;
  entropy: number;
  previousEntropy: number;
  elapsedMs: number;
  summary: string;
}

// ─── Full compile state ───────────────────────────────────────────────────────

interface CompileState {
  runId: string;
  activeStage: CompilerStageCode | null;
  stages: Map<CompilerStageCode, StageState>;
  entropyValues: Map<CompilerStageCode, number>;
  governorDecision: GovernorDecision | null;
  artifacts: ArtifactEntry[];
  iterationCount: number;
  passedGates: number;
  totalGates: number;
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ state }: { state: CompileState }): React.ReactElement {
  useElapsed(); // drives live timer

  const completedCount = Array.from(state.stages.values()).filter(
    (s) => s.phase === "artifact",
  ).length;

  const activeIdx = state.activeStage
    ? STAGE_ORDER.indexOf(state.activeStage)
    : -1;

  return (
    <Box
      borderStyle="double"
      borderColor={palette.accent.dim}
      paddingX={1}
      justifyContent="space-between"
    >
      <Box>
        <Text color={palette.accent.primary}>{glyphs.identity.core} ada</Text>
        <Text color={palette.text.secondary}>{"  by motherlabs"}</Text>
        {state.iterationCount > 1 && (
          <Text color={palette.semantic.warning}>
            {"  iteration "}
            {state.iterationCount}
            {"/3"}
          </Text>
        )}
      </Box>
      <Box>
        <DiamondProgressBar
          current={activeIdx >= 0 ? activeIdx : completedCount}
          total={7}
        />
        <Text color={palette.text.dim}>{"  "}</Text>
        <EntropyBar values={state.entropyValues} />
      </Box>
    </Box>
  );
}

// ─── Completed stage row ──────────────────────────────────────────────────────

function CompletedRow({
  code,
  data,
}: {
  code: CompilerStageCode;
  data: StageState;
}): React.ReactElement {
  const summary = useTypewriter(data.summary, 20);
  return (
    <Box>
      <Text color={palette.accent.dim}>
        {"  "}
        {glyphs.chevron}{" "}
      </Text>
      <Text color={palette.text.tertiary}>{code} </Text>
      <Text color={palette.semantic.verified}>{glyphs.status.pass}</Text>
      <Text color={palette.text.tertiary}>
        {"  "}
        {summary}
      </Text>
      <Text color={palette.text.dim}>
        {"  "}
        {data.entropy.toFixed(2)}
        {"  "}
        {formatElapsed(data.elapsedMs)}
      </Text>
    </Box>
  );
}

// ─── Crystallizing row (compact) ──────────────────────────────────────────────

function CrystallizingRow({
  code,
  data,
}: {
  code: CompilerStageCode;
  data: StageState;
}): React.ReactElement {
  return (
    <Box>
      <Text color={palette.accent.primary}>{"  "}</Text>
      <Text color={palette.text.secondary}>{code} </Text>
      <Crystallization compact />
      <Text color={palette.text.dim}>
        {"  "}
        {data.entropy.toFixed(2)}
        {"  "}
        {formatElapsed(data.elapsedMs)}
      </Text>
    </Box>
  );
}

// ─── Waiting stage row ────────────────────────────────────────────────────────

function WaitingRow({ code }: { code: CompilerStageCode }): React.ReactElement {
  return (
    <Box>
      <Text color={palette.text.dim}>
        {"  "}
        {glyphs.chevron}{" "}
      </Text>
      <Text color={palette.text.dim}>{code} </Text>
      <Text color={palette.text.dim}>
        {glyphs.status.queued}
        {"  waiting"}
      </Text>
    </Box>
  );
}

// ─── Main compile UI ──────────────────────────────────────────────────────────

function CompileUI({ state }: { state: CompileState }): React.ReactElement {
  const { activeStage } = state;

  // Classify stages
  const completedStages: Array<{ code: CompilerStageCode; data: StageState }> =
    [];
  const crystallizingStages: Array<{
    code: CompilerStageCode;
    data: StageState;
  }> = [];

  for (const code of STAGE_ORDER) {
    if (code === activeStage) break;
    const data = state.stages.get(code);
    if (!data) continue;
    if (data.phase === "artifact") {
      completedStages.push({ code, data });
    } else if (data.phase === "crystallizing") {
      crystallizingStages.push({ code, data });
    }
  }

  // Waiting stages: not started yet
  const startedCodes = new Set(state.stages.keys());
  const waitingStages: CompilerStageCode[] = [];
  let pastActive = activeStage === null;
  for (const code of STAGE_ORDER) {
    if (code === activeStage) {
      pastActive = true;
      continue;
    }
    if (pastActive && !startedCodes.has(code)) {
      waitingStages.push(code);
    }
  }

  const activeData = activeStage ? state.stages.get(activeStage) : undefined;

  // Governor decision panel: show when all stages done, no active stage
  const showFinalGovernor =
    !activeStage &&
    state.governorDecision !== null &&
    (() => {
      const govState = state.stages.get("GOV");
      return govState?.phase === "artifact";
    })();

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header state={state} />

      {/* Compile ID */}
      <Box
        borderStyle="single"
        borderColor={palette.text.dim}
        flexDirection="column"
        paddingX={1}
      >
        <Text color={palette.text.secondary}>
          {"  COMPILING  "}
          <Text color={palette.text.tertiary}>{state.runId}</Text>
        </Text>
      </Box>

      {/* Completed stages — collapsed to dim summary rows */}
      {completedStages.length > 0 && !showFinalGovernor && (
        <Box
          borderStyle="single"
          borderColor={palette.text.dim}
          flexDirection="column"
          paddingX={1}
        >
          {completedStages.map(({ code, data }) => (
            <CompletedRow key={code} code={code} data={data} />
          ))}
        </Box>
      )}

      {/* Crystallizing stages — compact transition rows */}
      {crystallizingStages.length > 0 && (
        <Box
          borderStyle="single"
          borderColor={palette.accent.dim}
          flexDirection="column"
          paddingX={1}
        >
          {crystallizingStages.map(({ code, data }) => (
            <CrystallizingRow key={code} code={code} data={data} />
          ))}
        </Box>
      )}

      {/* Active stage — full glass box panel */}
      {activeStage && activeData && (
        <StagePanel
          stage={activeStage}
          phase={activeData.phase}
          reasoningTokens={activeData.reasoningTokens}
          artifact={activeData.artifact}
          entropy={activeData.entropy}
          previousEntropy={activeData.previousEntropy}
          elapsedMs={activeData.elapsedMs}
        />
      )}

      {/* Waiting stages */}
      {waitingStages.length > 0 && (
        <Box
          borderStyle="single"
          borderColor={palette.text.dim}
          flexDirection="column"
          paddingX={1}
        >
          {waitingStages.map((code) => (
            <WaitingRow key={code} code={code} />
          ))}
        </Box>
      )}

      {/* Final state: all stages complete + governor decision */}
      {showFinalGovernor && (
        <>
          <Box
            borderStyle="single"
            borderColor={palette.text.dim}
            flexDirection="column"
            paddingX={1}
          >
            {STAGE_ORDER.map((code) => {
              const data = state.stages.get(code);
              if (data?.phase === "artifact") {
                return <CompletedRow key={code} code={code} data={data} />;
              }
              return null;
            })}
          </Box>
          <StagePanel
            stage="GOV"
            phase="artifact"
            reasoningTokens={state.stages.get("GOV")?.reasoningTokens ?? ""}
            artifact={state.governorDecision}
            entropy={state.stages.get("GOV")?.entropy ?? 0}
            previousEntropy={state.stages.get("GOV")?.previousEntropy ?? 1.0}
            elapsedMs={state.stages.get("GOV")?.elapsedMs ?? 0}
          />
        </>
      )}

      {/* Artifacts written */}
      {state.artifacts.length > 0 && (
        <ArtifactList artifacts={state.artifacts} />
      )}

      {/* ACCEPT footer */}
      {state.governorDecision?.decision === "ACCEPT" && (
        <Box
          borderStyle="single"
          borderColor={palette.semantic.verified}
          paddingX={1}
        >
          <Text color={palette.semantic.verified}>
            {"  "}
            {glyphs.chevron} ready. run: claude --yes
          </Text>
        </Box>
      )}

      {/* Keybind footer */}
      <Text color={palette.text.dim}>{"  q quit  r retry  esc interrupt"}</Text>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPERATIVE RENDERER
// ═══════════════════════════════════════════════════════════════════════════════

export interface CompileRenderer {
  onStageStart(stage: CompilerStageCode): void;
  onStageToken(stage: CompilerStageCode, token: string): void;
  /** Triggers the crystallizing phase for this stage. */
  onStageCrystallize(
    stage: CompilerStageCode,
    entropy: number,
    elapsedMs: number,
  ): void;
  onStageComplete(
    stage: CompilerStageCode,
    summary: string,
    entropy: number,
    elapsedMs: number,
    artifact: unknown,
  ): void;
  onGovernorDecision(
    decision: GovernorDecision,
    gates: { passed: number; total: number },
  ): void;
  onIteration(count: number): void;
  onArtifactsWritten(artifacts: ArtifactEntry[]): void;
  unmount(): void;
}

export function createCompileRenderer(runId: string): CompileRenderer {
  const stages = new Map<CompilerStageCode, StageState>();
  const entropyValues = new Map<CompilerStageCode, number>();
  let activeStage: CompilerStageCode | null = null;
  let governorDecision: GovernorDecision | null = null;
  let artifactEntries: ArtifactEntry[] = [];
  let iterationCount = 1;
  let passedGates = 0;
  let totalGates = 0;
  let previousEntropy = 1.0;
  const stageStartTimes = new Map<CompilerStageCode, number>();

  function buildState(): CompileState {
    return {
      runId,
      activeStage,
      stages,
      entropyValues,
      governorDecision,
      artifacts: artifactEntries,
      iterationCount,
      passedGates,
      totalGates,
    };
  }

  const { rerender, unmount: inkUnmount } = render(
    React.createElement(CompileUI, { state: buildState() }),
  );

  function update(): void {
    rerender(React.createElement(CompileUI, { state: buildState() }));
  }

  return {
    onStageStart(stage) {
      activeStage = stage;
      stageStartTimes.set(stage, Date.now());
      stages.set(stage, {
        phase: "reasoning",
        reasoningTokens: "",
        artifact: null,
        entropy: previousEntropy,
        previousEntropy,
        elapsedMs: 0,
        summary: "",
      });
      update();
    },

    onStageToken(stage, token) {
      const state = stages.get(stage);
      if (state) {
        state.reasoningTokens += token;
        state.elapsedMs =
          Date.now() - (stageStartTimes.get(stage) ?? Date.now());
        update();
      }
    },

    onStageCrystallize(stage, entropy, elapsedMs) {
      // Make this stage the active focus and show crystallizing phase
      activeStage = stage;
      const existing = stages.get(stage);
      stages.set(stage, {
        phase: "crystallizing",
        reasoningTokens: existing?.reasoningTokens ?? "",
        artifact: null,
        entropy,
        previousEntropy: existing?.previousEntropy ?? previousEntropy,
        elapsedMs,
        summary: "",
      });
      entropyValues.set(stage, entropy);
      previousEntropy = entropy;
      update();
    },

    onStageComplete(stage, summary, entropy, elapsedMs, artifact) {
      const existing = stages.get(stage);
      stages.set(stage, {
        phase: "artifact",
        reasoningTokens: existing?.reasoningTokens ?? "",
        artifact,
        entropy,
        previousEntropy: existing?.previousEntropy ?? previousEntropy,
        elapsedMs,
        summary,
      });
      entropyValues.set(stage, entropy);
      previousEntropy = entropy;
      totalGates++;
      if (entropy < 0.7) passedGates++;
      // Keep activeStage pointing to this stage until the next onStageStart
      // or onStageCrystallize call changes it
      if (activeStage === stage) {
        // Let the active stage show its artifact briefly before next stage starts
        activeStage = stage;
      }
      update();
    },

    onGovernorDecision(decision, gates) {
      governorDecision = decision;
      passedGates = gates.passed;
      totalGates = gates.total;
      activeStage = null;
      update();
    },

    onIteration(count) {
      iterationCount = count;
      stages.clear();
      entropyValues.clear();
      activeStage = null;
      governorDecision = null;
      previousEntropy = 1.0;
      passedGates = 0;
      totalGates = 0;
      update();
    },

    onArtifactsWritten(artifacts) {
      artifactEntries = artifacts;
      update();
    },

    unmount() {
      inkUnmount();
    },
  };
}
