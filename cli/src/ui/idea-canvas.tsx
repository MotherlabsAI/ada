import React from "react";
import { Text, Box } from "ink";
import { palette, glyphs } from "./design-system.js";
import { useTypewriter } from "./hooks.js";
import type {
  IntentGraph,
  DomainContext,
  EntityMap,
  Blueprint,
  AuditReport,
  GovernorDecision,
} from "@ada/compiler";

// ─── Individual slot components ───────────────────────────────────────────────

function Slot({
  label,
  value,
  color,
  done,
}: {
  label: string;
  value: string;
  color: string;
  done: boolean;
}): React.ReactElement {
  const revealed = useTypewriter(value, 12);
  const glyph = done ? glyphs.identity.filled : glyphs.identity.core;
  const glyphColor = done ? palette.semantic.verified : palette.accent.primary;

  return (
    <Box>
      <Text color={palette.text.dim}>{"  "}</Text>
      <Text color={glyphColor}>{glyph} </Text>
      <Text color={palette.text.tertiary}>{label}: </Text>
      <Text color={color}>{revealed}</Text>
    </Box>
  );
}

// ─── IdeaStatePanel ───────────────────────────────────────────────────────────

interface IdeaStatePanelProps {
  readonly intent: IntentGraph | null;
  readonly persona: DomainContext | null;
  readonly entity: EntityMap | null;
  readonly synthesis: Blueprint | null;
  readonly verify: AuditReport | null;
  readonly governor: GovernorDecision | null;
  readonly activeStage: string | null;
}

export function IdeaStatePanel({
  intent,
  persona,
  entity,
  synthesis,
  verify,
  governor,
  activeStage,
}: IdeaStatePanelProps): React.ReactElement | null {
  // Only render once INT has produced something
  if (!intent && !activeStage) return null;
  const hasAnything = intent ?? persona ?? entity ?? synthesis ?? verify;
  if (!hasAnything) return null;

  const borderColor =
    governor?.decision === "ACCEPT"
      ? palette.semantic.verified
      : governor?.decision === "REJECT"
        ? palette.semantic.failure
        : palette.accent.dim;

  // ── Build slots ────────────────────────────────────────────────────────────

  const goalText = intent
    ? intent.goals
        .slice(0, 4)
        .map((g) => g.description.split(".")[0])
        .join(" · ")
    : "";

  const domainText = persona
    ? `${persona.domain}${persona.stakeholders.length > 0 ? ` · ${persona.stakeholders[0]!.role}` : ""}`
    : "";

  const entityText = entity
    ? entity.entities
        .slice(0, 5)
        .map((e) => e.name)
        .join(" · ")
    : "";

  const archText = synthesis
    ? synthesis.architecture.components
        .slice(0, 4)
        .map((c) => c.name)
        .join(" · ")
    : "";

  const qualityText = verify
    ? `coverage ${verify.coverageScore.toFixed(2)} · coherence ${verify.coherenceScore.toFixed(2)}`
    : "";

  const decisionText = governor
    ? `${governor.decision} · confidence ${governor.confidence.toFixed(2)}`
    : "";

  return (
    <Box
      borderStyle="single"
      borderColor={borderColor}
      flexDirection="column"
      paddingX={1}
    >
      {/* Header */}
      <Box>
        <Text color={palette.text.dim}>{"  "}</Text>
        <Text color={palette.accent.dim}>{glyphs.identity.open} </Text>
        <Text color={palette.text.tertiary}>idea</Text>
        {intent && (
          <>
            <Text color={palette.text.dim}>{" · "}</Text>
            <Text color={palette.text.tertiary}>
              {intent.rawIntent.slice(0, 60)}
              {intent.rawIntent.length > 60 ? glyphs.pipeline.ellipsis : ""}
            </Text>
          </>
        )}
      </Box>

      {/* Goals */}
      {goalText && (
        <Slot
          label="goals"
          value={goalText}
          color={palette.text.secondary}
          done={activeStage !== "INT" && !!intent}
        />
      )}

      {/* Domain */}
      {domainText && (
        <Slot
          label="domain"
          value={domainText}
          color={palette.accent.pale}
          done={!!persona}
        />
      )}

      {/* Entities */}
      {entityText && (
        <Slot
          label="entities"
          value={entityText}
          color={palette.text.secondary}
          done={!!entity}
        />
      )}

      {/* Architecture */}
      {archText && (
        <Slot
          label="architecture"
          value={`${synthesis!.architecture.pattern} · ${archText}`}
          color={palette.accent.primary}
          done={!!synthesis}
        />
      )}

      {/* Quality */}
      {qualityText && (
        <Slot
          label="quality"
          value={qualityText}
          color={
            verify && verify.coverageScore >= 0.7
              ? palette.semantic.verified
              : palette.semantic.warning
          }
          done={!!verify}
        />
      )}

      {/* Decision */}
      {decisionText && (
        <Slot
          label="decision"
          value={decisionText}
          color={
            governor?.decision === "ACCEPT"
              ? palette.semantic.verified
              : governor?.decision === "REJECT"
                ? palette.semantic.failure
                : palette.semantic.warning
          }
          done={!!governor}
        />
      )}
    </Box>
  );
}
