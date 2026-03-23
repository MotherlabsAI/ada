import React from "react";
import { Text, Box } from "ink";
import { palette, glyphs } from "./design-system.js";
import { useProgressFill } from "./hooks.js";
import type { AuditReport } from "@ada/compiler";

// ─── Single animated bar ──────────────────────────────────────────────────────

interface CoverageBarProps {
  readonly label: string;
  readonly value: number;
  readonly threshold: number;
  readonly barWidth?: number | undefined;
}

function CoverageBar({
  label,
  value,
  threshold,
  barWidth = 10,
}: CoverageBarProps): React.ReactElement {
  const filled = useProgressFill(value, 300);
  const passes = value >= threshold;
  const filledCount = Math.round(filled * barWidth);
  const emptyCount = barWidth - filledCount;

  const barColor = passes
    ? palette.semantic.verified
    : palette.semantic.failure;
  const glyphPass = passes ? glyphs.status.pass : glyphs.status.fail;
  const statusColor = passes
    ? palette.semantic.verified
    : palette.semantic.failure;

  return (
    <Box>
      <Text color={palette.text.dim}>{"  "}</Text>
      <Text color={palette.text.secondary}>{label.padEnd(10)}</Text>
      <Text color={palette.text.tertiary}>{value.toFixed(2)} </Text>
      <Text color={barColor}>
        {"\u2588".repeat(filledCount)}
        <Text color={palette.text.dim}>{"\u2591".repeat(emptyCount)}</Text>
      </Text>
      <Text color={palette.text.dim}>{"  "}</Text>
      <Text color={statusColor}>{glyphPass}</Text>
    </Box>
  );
}

// ─── Coverage bars panel ──────────────────────────────────────────────────────

interface CoverageBarsProps {
  readonly data: AuditReport;
}

export function CoverageBars({ data }: CoverageBarsProps): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={1}>
      <CoverageBar
        label="coverage"
        value={data.coverageScore}
        threshold={0.85}
      />
      <CoverageBar
        label="coherence"
        value={data.coherenceScore}
        threshold={0.9}
      />
      {data.gaps.length > 0 && (
        <>
          <Text>{""}</Text>
          <Box>
            <Text color={palette.text.dim}>{"  "}</Text>
            <Text color={palette.text.secondary}>GAPS</Text>
          </Box>
          {data.gaps.slice(0, 4).map((gap, i) => (
            <Box key={i}>
              <Text color={palette.text.dim}>{"  "}</Text>
              <Text color={palette.semantic.warning} wrap="truncate">
                {glyphs.pipeline.separator} {gap}
              </Text>
            </Box>
          ))}
          {data.gaps.length > 4 && (
            <Box>
              <Text color={palette.text.dim}>{"  "}</Text>
              <Text color={palette.text.tertiary}>
                {glyphs.pipeline.ellipsis} {data.gaps.length - 4} more
              </Text>
            </Box>
          )}
        </>
      )}
      {data.drifts.length > 0 && (
        <>
          <Text>{""}</Text>
          <Box>
            <Text color={palette.text.dim}>{"  "}</Text>
            <Text color={palette.text.secondary}>
              DRIFTS
              {data.drifts.filter((d) => d.severity === "critical").length}{" "}
              critical
              {"  "}
              {glyphs.pipeline.separator}
              {"  "}
              {data.drifts.filter((d) => d.severity === "major").length} major
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
}
