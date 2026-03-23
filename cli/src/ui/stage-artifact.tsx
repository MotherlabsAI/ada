import React, { useState, useEffect } from "react";
import { Text, Box } from "ink";
import { palette, glyphs } from "./design-system.js";
import { EntityTree } from "./entity-tree.js";
import { WorkflowDiagram } from "./workflow-diagram.js";
import { CoverageBars } from "./coverage-bars.js";
import type {
  CompilerStageCode,
  IntentGraph,
  DomainContext,
  EntityMap,
  ProcessFlow,
  Blueprint,
  AuditReport,
  GovernorDecision,
} from "@ada/compiler";

// ─── Progressive reveal hook ──────────────────────────────────────────────────

function useReveal(total: number, delayMs: number = 80): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (count >= total) return;
    const t = setTimeout(() => setCount((c) => c + 1), delayMs);
    return () => clearTimeout(t);
  }, [count, total, delayMs]);
  return count;
}

// ─── INT artifact ─────────────────────────────────────────────────────────────

function IntentArtifact({ data }: { data: IntentGraph }): React.ReactElement {
  const goals = data.goals.slice(0, 8);
  const constraints = data.constraints.slice(0, 4);
  const unknowns = data.unknowns.slice(0, 3);
  const totalItems =
    goals.length + 1 + constraints.length + 1 + unknowns.length;
  const reveal = useReveal(totalItems, 60);

  const items: React.ReactElement[] = [];
  let idx = 0;

  // Goals header
  if (reveal > idx) {
    items.push(
      <Box key="gh">
        <Text color={palette.text.dim}>{"  "}</Text>
        <Text color={palette.text.secondary}>GOALS </Text>
        <Text color={palette.accent.primary}>{data.goals.length}</Text>
      </Box>,
    );
  }
  idx++;

  // Goals
  for (let i = 0; i < goals.length; i++) {
    const g = goals[i]!;
    if (reveal > idx) {
      items.push(
        <Box key={`g${i}`}>
          <Text color={palette.text.dim}>{"  "}</Text>
          <Text color={palette.text.tertiary}>{g.id} </Text>
          <Text color={palette.text.primary} wrap="truncate">
            {g.description}
          </Text>
          <Text color={palette.text.dim}> {g.type}</Text>
        </Box>,
      );
    }
    idx++;
  }

  // Constraints header + items
  if (reveal > idx) {
    items.push(
      <Box key="ch">
        <Text color={palette.text.dim}>{"  "}</Text>
        <Text color={palette.text.secondary}>CONSTRAINTS </Text>
        <Text color={palette.accent.primary}>{data.constraints.length}</Text>
      </Box>,
    );
  }
  idx++;

  for (let i = 0; i < constraints.length; i++) {
    const c = constraints[i]!;
    if (reveal > idx) {
      items.push(
        <Box key={`c${i}`}>
          <Text color={palette.text.dim}>{"  "}</Text>
          <Text color={palette.text.tertiary}>{c.id} </Text>
          <Text color={palette.text.primary} wrap="truncate">
            {c.description}
          </Text>
          <Text color={palette.text.dim}> {c.source}</Text>
        </Box>,
      );
    }
    idx++;
  }

  // Unknowns
  if (reveal > idx) {
    items.push(
      <Box key="uh">
        <Text color={palette.text.dim}>{"  "}</Text>
        <Text color={palette.text.secondary}>UNKNOWNS </Text>
        <Text color={palette.semantic.warning}>{data.unknowns.length}</Text>
      </Box>,
    );
  }
  idx++;

  for (let i = 0; i < unknowns.length; i++) {
    const u = unknowns[i]!;
    if (reveal > idx) {
      items.push(
        <Box key={`u${i}`}>
          <Text color={palette.text.dim}>{"  "}</Text>
          <Text color={palette.text.tertiary}>{u.id} </Text>
          <Text
            color={
              u.impact === "blocking"
                ? palette.semantic.warning
                : palette.text.primary
            }
            wrap="truncate"
          >
            {u.description}
          </Text>
        </Box>,
      );
    }
    idx++;
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {items}
    </Box>
  );
}

// ─── PER artifact ─────────────────────────────────────────────────────────────

function PersonaArtifact({
  data,
}: {
  data: DomainContext;
}): React.ReactElement {
  const vocabEntries = Object.entries(data.ubiquitousLanguage).slice(0, 6);
  const excluded = data.excludedConcerns.slice(0, 5);
  const totalItems = 1 + vocabEntries.length + 1 + excluded.length;
  const reveal = useReveal(totalItems, 70);

  const items: React.ReactElement[] = [];
  let idx = 0;

  if (reveal > idx) {
    items.push(
      <Box key="domain">
        <Text color={palette.text.dim}>{"  "}</Text>
        <Text color={palette.text.secondary}>world </Text>
        <Text color={palette.accent.primary}>{data.domain}</Text>
      </Box>,
    );
  }
  idx++;

  if (vocabEntries.length > 0) {
    if (reveal > idx) {
      items.push(
        <Box key="vh">
          <Text color={palette.text.dim}>{"  "}</Text>
          <Text color={palette.text.secondary}>VOCABULARY</Text>
        </Box>,
      );
    }
    idx++;
    for (let i = 0; i < vocabEntries.length; i++) {
      const [k, v] = vocabEntries[i]!;
      if (reveal > idx) {
        items.push(
          <Box key={`v${i}`}>
            <Text color={palette.text.dim}>{"  "}</Text>
            <Text color={palette.accent.pale}>{k} </Text>
            <Text color={palette.text.dim}>= </Text>
            <Text color={palette.text.primary} wrap="truncate">
              {v}
            </Text>
          </Box>,
        );
      }
      idx++;
    }
  }

  if (excluded.length > 0) {
    if (reveal > idx) {
      items.push(
        <Box key="exh">
          <Text color={palette.text.dim}>{"  "}</Text>
          <Text color={palette.text.secondary}>EXCLUDES</Text>
        </Box>,
      );
    }
    idx++;
    for (let i = 0; i < excluded.length; i++) {
      const ex = excluded[i]!;
      if (reveal > idx) {
        items.push(
          <Box key={`ex${i}`}>
            <Text color={palette.text.dim}>{"  "}</Text>
            <Text color={palette.semantic.failure}>{glyphs.status.fail} </Text>
            <Text color={palette.text.secondary} wrap="truncate">
              {ex}
            </Text>
          </Box>,
        );
      }
      idx++;
    }
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {items}
    </Box>
  );
}

// ─── ENT artifact — uses EntityTree ──────────────────────────────────────────

function EntityArtifact({ data }: { data: EntityMap }): React.ReactElement {
  return <EntityTree data={data} maxEntities={7} />;
}

// ─── PRO artifact — uses WorkflowDiagram ─────────────────────────────────────

function ProcessArtifact({ data }: { data: ProcessFlow }): React.ReactElement {
  return <WorkflowDiagram data={data} maxWorkflows={2} maxSteps={3} />;
}

// ─── SYN artifact ─────────────────────────────────────────────────────────────

function SynthesisArtifact({ data }: { data: Blueprint }): React.ReactElement {
  const components = data.architecture.components.slice(0, 8);
  const reveal = useReveal(components.length + 2, 70);

  const items: React.ReactElement[] = [];
  let idx = 0;

  if (reveal > idx) {
    items.push(
      <Box key="sum">
        <Text color={palette.text.dim}>{"  "}</Text>
        <Text color={palette.text.primary} wrap="truncate">
          {data.summary}
        </Text>
      </Box>,
    );
  }
  idx++;

  if (reveal > idx) {
    items.push(
      <Box key="pat">
        <Text color={palette.text.dim}>{"  "}</Text>
        <Text color={palette.text.secondary}>pattern </Text>
        <Text color={palette.accent.primary}>{data.architecture.pattern}</Text>
      </Box>,
    );
  }
  idx++;

  for (let i = 0; i < components.length; i++) {
    const comp = components[i]!;
    if (reveal > idx) {
      items.push(
        <Box key={`comp${i}`}>
          <Text color={palette.text.dim}>{"  \u251C\u2500\u2500 "}</Text>
          <Text color={palette.text.primary}>{comp.name} </Text>
          <Text color={palette.text.tertiary} wrap="truncate">
            {comp.responsibility}
          </Text>
        </Box>,
      );
    }
    idx++;
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {items}
      <Text>{""}</Text>
      <Box>
        <Text color={palette.text.dim}>{"  "}</Text>
        <Text color={palette.text.tertiary}>
          {data.architecture.components.length} components
          {"  "}
          {glyphs.pipeline.separator}
          {"  "}
          {data.openQuestions.length} open questions
        </Text>
      </Box>
    </Box>
  );
}

// ─── VER artifact — uses CoverageBars ────────────────────────────────────────

function VerifyArtifact({ data }: { data: AuditReport }): React.ReactElement {
  return <CoverageBars data={data} />;
}

// ─── GOV artifact ─────────────────────────────────────────────────────────────

function GovernorArtifact({
  data,
}: {
  data: GovernorDecision;
}): React.ReactElement {
  const decisionColor =
    data.decision === "ACCEPT"
      ? palette.semantic.verified
      : data.decision === "REJECT"
        ? palette.semantic.failure
        : palette.semantic.warning;

  const decisionGlyph =
    data.decision === "ACCEPT"
      ? glyphs.chevron
      : data.decision === "REJECT"
        ? glyphs.identity.filled
        : glyphs.pipeline.cycle;

  const borderStyle =
    data.decision === "ACCEPT" ? ("bold" as const) : ("single" as const);

  const reveal = useReveal(6, 80);

  return (
    <Box
      borderStyle={borderStyle}
      borderColor={decisionColor}
      flexDirection="column"
      paddingX={1}
    >
      {/* Decision line */}
      <Box>
        <Text color={palette.text.dim}>{"  "}</Text>
        <Text color={decisionColor}>
          {decisionGlyph}
          {"  "}
        </Text>
        <Text color={decisionColor}>{data.decision}</Text>
        <Text color={palette.text.secondary}>{"  confidence: "}</Text>
        <Text color={decisionColor}>{data.confidence.toFixed(2)}</Text>
      </Box>

      <Text>{""}</Text>

      {reveal > 0 && (
        <Box>
          <Text color={palette.text.dim}>{"  "}</Text>
          <Text color={palette.text.secondary}>coverage </Text>
          <Text
            color={
              data.coverageScore >= 0.85
                ? palette.semantic.verified
                : palette.semantic.failure
            }
          >
            {data.coverageScore.toFixed(2)}{" "}
            {data.coverageScore >= 0.85
              ? glyphs.status.pass
              : glyphs.status.fail}
          </Text>
        </Box>
      )}
      {reveal > 1 && (
        <Box>
          <Text color={palette.text.dim}>{"  "}</Text>
          <Text color={palette.text.secondary}>coherence </Text>
          <Text
            color={
              data.coherenceScore >= 0.9
                ? palette.semantic.verified
                : palette.semantic.failure
            }
          >
            {data.coherenceScore.toFixed(2)}{" "}
            {data.coherenceScore >= 0.9
              ? glyphs.status.pass
              : glyphs.status.fail}
          </Text>
        </Box>
      )}
      {reveal > 2 && (
        <Box>
          <Text color={palette.text.dim}>{"  "}</Text>
          <Text color={palette.text.secondary}>gates </Text>
          <Text
            color={
              data.gatePassRate >= 0.8
                ? palette.semantic.verified
                : palette.semantic.failure
            }
          >
            {data.gatePassRate.toFixed(2)}{" "}
            {data.gatePassRate >= 0.8 ? glyphs.status.pass : glyphs.status.fail}
          </Text>
        </Box>
      )}
      {reveal > 3 && (
        <Box>
          <Text color={palette.text.dim}>{"  "}</Text>
          <Text color={palette.text.secondary}>provenance </Text>
          <Text
            color={
              data.provenanceIntact
                ? palette.semantic.verified
                : palette.semantic.failure
            }
          >
            {data.provenanceIntact ? "intact" : "broken"}{" "}
            {data.provenanceIntact ? glyphs.status.pass : glyphs.status.fail}
          </Text>
        </Box>
      )}

      {/* Next action for ITERATE */}
      {reveal > 4 && data.nextAction && (
        <>
          <Text>{""}</Text>
          <Box>
            <Text color={palette.text.dim}>{"  "}</Text>
            <Text color={palette.semantic.warning}>
              {glyphs.pipeline.therefore}{" "}
            </Text>
            <Text color={palette.semantic.warning} wrap="truncate">
              {typeof data.nextAction === "string"
                ? data.nextAction.slice(0, 200)
                : ""}
            </Text>
          </Box>
        </>
      )}

      {/* Rejection reasons for REJECT */}
      {reveal > 5 &&
        data.rejectionReasons.length > 0 &&
        data.rejectionReasons.slice(0, 3).map((r, i) => (
          <Box key={i}>
            <Text color={palette.text.dim}>{"  "}</Text>
            <Text color={palette.semantic.failure}>
              {glyphs.pipeline.because}{" "}
            </Text>
            <Text color={palette.semantic.failure} wrap="truncate">
              {r}
            </Text>
          </Box>
        ))}
    </Box>
  );
}

// ─── Stage artifact dispatcher ────────────────────────────────────────────────

interface StageArtifactProps {
  readonly stage: CompilerStageCode;
  readonly artifact: unknown;
}

export function StageArtifact({
  stage,
  artifact,
}: StageArtifactProps): React.ReactElement {
  if (!artifact) {
    return (
      <Box paddingX={1}>
        <Text color={palette.text.dim}>{"  "}</Text>
        <Text color={palette.text.tertiary}>no artifact</Text>
      </Box>
    );
  }

  switch (stage) {
    case "CTX":
      return (
        <Box paddingX={1}>
          <Text color={palette.text.dim}>{"  "}</Text>
          <Text color={palette.text.tertiary}>static analysis</Text>
        </Box>
      );
    case "INT":
      return <IntentArtifact data={artifact as IntentGraph} />;
    case "PER":
      return <PersonaArtifact data={artifact as DomainContext} />;
    case "ENT":
      return <EntityArtifact data={artifact as EntityMap} />;
    case "PRO":
      return <ProcessArtifact data={artifact as ProcessFlow} />;
    case "SYN":
      return <SynthesisArtifact data={artifact as Blueprint} />;
    case "VER":
      return <VerifyArtifact data={artifact as AuditReport} />;
    case "GOV":
      return <GovernorArtifact data={artifact as GovernorDecision} />;
  }
}
