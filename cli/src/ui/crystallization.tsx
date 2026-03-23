import React, { useEffect } from "react";
import { Text, Box } from "ink";
import { palette, glyphs } from "./design-system.js";
import { useCrystallize } from "./hooks.js";

// ─── Crystallization animation ────────────────────────────────────────────────
// ◇ → ◈ → ◆  over ~300ms (100ms per step)
// step 0 = ◇ (open, pending)
// step 1 = ◈ (shaped, forming)
// step 2 = ◆ (filled, crystallized)
// step 3 = done

interface CrystallizationProps {
  readonly onComplete?: (() => void) | undefined;
  readonly compact?: boolean | undefined;
}

export function Crystallization({
  onComplete,
  compact = false,
}: CrystallizationProps): React.ReactElement {
  const { step, done } = useCrystallize();

  useEffect(() => {
    if (done && onComplete) {
      const t = setTimeout(onComplete, 0);
      return () => clearTimeout(t);
    }
  }, [done, onComplete]);

  // Color each step based on current progress
  const openColor = step >= 0 ? palette.accent.dim : palette.text.dim;
  const coreColor = step >= 1 ? palette.accent.primary : palette.text.dim;
  const filledColor = step >= 2 ? palette.semantic.verified : palette.text.dim;
  const arrowColor = step >= 1 ? palette.accent.dim : palette.text.dim;

  if (compact) {
    // Compact row for collapsed display
    return (
      <Box>
        <Text color={openColor}>{glyphs.identity.open}</Text>
        <Text color={arrowColor}> {glyphs.pipeline.arrow} </Text>
        <Text color={coreColor}>{glyphs.identity.core}</Text>
        <Text color={arrowColor}> {glyphs.pipeline.arrow} </Text>
        <Text color={filledColor}>{glyphs.identity.filled}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text>{""}</Text>
      <Box>
        <Text color={palette.text.dim}>{"  "}</Text>
        <Text color={openColor}>{glyphs.identity.open}</Text>
        <Text color={arrowColor}> {glyphs.pipeline.arrow} </Text>
        <Text color={coreColor}>{glyphs.identity.core}</Text>
        <Text color={arrowColor}> {glyphs.pipeline.arrow} </Text>
        <Text color={filledColor}>{glyphs.identity.filled}</Text>
        <Text color={palette.text.tertiary}>
          {"  "}
          {step < 2 ? "crystallizing" : "crystallized"}
          {step < 2 ? glyphs.pipeline.ellipsis : ""}
        </Text>
      </Box>
      <Text>{""}</Text>
    </Box>
  );
}
