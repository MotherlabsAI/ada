import React, { useState, useEffect, useRef } from "react";
import { Text, Box, useStdout } from "ink";
import { palette, glyphs } from "./design-system.js";

interface StageReasoningProps {
  readonly tokens: string;
  readonly maxLines?: number | undefined;
}

function colorize(line: string): { text: string; color: string } {
  const trimmed = line.trim();

  // ∴ therefore lines
  if (
    trimmed.startsWith("\u2234") ||
    trimmed.toLowerCase().startsWith("therefore")
  ) {
    return { text: line, color: palette.accent.pale };
  }
  // ∵ because lines
  if (
    trimmed.startsWith("\u2235") ||
    trimmed.toLowerCase().startsWith("because")
  ) {
    return { text: line, color: palette.text.secondary };
  }
  // ✗ failure lines
  if (trimmed.startsWith("\u2717") || trimmed.startsWith("✗")) {
    return { text: line, color: palette.semantic.failure };
  }
  // ✓ pass lines
  if (trimmed.startsWith("\u2713") || trimmed.startsWith("✓")) {
    return { text: line, color: palette.semantic.verified };
  }
  // ◈ insight lines
  if (trimmed.startsWith("\u25C8") || trimmed.startsWith("◈")) {
    return { text: line, color: palette.accent.primary };
  }
  // Predicate lines (contain operators)
  if (/[><=!]=|[><]|\u2208/.test(trimmed) && trimmed.includes(".")) {
    return { text: line, color: palette.accent.primary };
  }
  // Quoted text
  if (
    trimmed.startsWith('"') ||
    trimmed.startsWith("'") ||
    trimmed.startsWith("\u201C")
  ) {
    return { text: line, color: palette.text.primary };
  }
  // Default
  return { text: line, color: palette.text.secondary };
}

export function StageReasoning({
  tokens,
  maxLines,
}: StageReasoningProps): React.ReactElement {
  const limit = maxLines ?? 18;
  const lines = tokens.split("\n");
  const visible = lines.slice(-limit);

  return (
    <Box flexDirection="column" paddingX={1}>
      {visible.map((line, i) => {
        const { text, color } = colorize(line);
        return (
          <Text key={i} color={color} wrap="truncate">
            {"  "}
            {text}
          </Text>
        );
      })}
    </Box>
  );
}
