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

const CRYSTAL_FRAMES = [
  { glyph: glyphs.identity.open, color: palette.accent.dim },
  { glyph: glyphs.identity.core, color: palette.accent.primary },
  { glyph: glyphs.identity.filled, color: palette.semantic.verified },
] as const;

export function Crystallization({
  compact = false,
}: CrystallizationProps): React.ReactElement {
  const { step } = useCrystallize();
  const frame = CRYSTAL_FRAMES[step % 3]!;

  if (compact) {
    return <Text color={frame.color}>{frame.glyph}</Text>;
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text>{""}</Text>
      <Box>
        <Text color={palette.text.dim}>{"  "}</Text>
        <Text color={frame.color}>{frame.glyph}</Text>
        <Text color={palette.text.tertiary}>
          {"  crystallizing"}
          {glyphs.pipeline.ellipsis}
        </Text>
      </Box>
      <Text>{""}</Text>
    </Box>
  );
}
