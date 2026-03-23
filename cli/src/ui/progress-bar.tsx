import React from "react";
import { Text } from "ink";
import { palette, glyphs } from "./design-system.js";

interface DiamondProgressBarProps {
  readonly current: number;
  readonly total: number;
}

export function DiamondProgressBar({ current, total }: DiamondProgressBarProps): React.ReactElement {
  const chars = Array.from({ length: total }, (_, i) => {
    if (i < current) return { char: glyphs.identity.filled, color: palette.semantic.verified };
    if (i === current) return { char: glyphs.identity.core, color: palette.accent.primary };
    return { char: glyphs.identity.open, color: palette.text.tertiary };
  });

  return (
    <>
      {chars.map((c, i) => (
        <Text key={i} color={c.color}>{c.char}</Text>
      ))}
    </>
  );
}
