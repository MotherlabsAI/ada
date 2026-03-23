import React from "react";
import { Text, Box } from "ink";
import { palette, glyphs, formatElapsed } from "./design-system.js";

export interface ArtifactEntry {
  readonly path: string;
  readonly written: boolean;
  readonly detail?: string | undefined;
}

interface ArtifactListProps {
  readonly artifacts: readonly ArtifactEntry[];
  readonly totalElapsed?: number | undefined;
  readonly estimatedCost?: string | undefined;
}

export function ArtifactList({ artifacts, totalElapsed, estimatedCost }: ArtifactListProps): React.ReactElement {
  return (
    <Box borderStyle="single" borderColor={palette.text.dim} flexDirection="column" paddingX={1}>
      <Box justifyContent="space-between">
        <Text color={palette.text.secondary}>  ARTIFACTS</Text>
        <Box>
          {totalElapsed !== undefined && (
            <Text color={palette.text.tertiary}>{formatElapsed(totalElapsed)}</Text>
          )}
          {estimatedCost && (
            <Text color={palette.text.tertiary}>{"  ~"}{estimatedCost}</Text>
          )}
        </Box>
      </Box>
      {artifacts.map((a, i) => (
        <Box key={i}>
          <Text color={a.written ? palette.semantic.verified : palette.text.tertiary}>
            {"  "}{a.written ? glyphs.status.pass : glyphs.status.queued}{"  "}
          </Text>
          <Text color={a.written ? palette.text.primary : palette.text.tertiary}>
            {a.path}
          </Text>
          {a.detail && (
            <Text color={palette.text.secondary}>{"  "}{a.detail}</Text>
          )}
        </Box>
      ))}
      {artifacts.length === 0 && (
        <Text color={palette.text.tertiary}>{"  "}{glyphs.status.queued}{"  waiting"}{glyphs.pipeline.ellipsis}</Text>
      )}
    </Box>
  );
}
