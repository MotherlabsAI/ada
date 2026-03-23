import React, { useRef, useState, useEffect } from "react";
import { Text, Box } from "ink";
import { palette, glyphs } from "./design-system.js";
import { useColorFlash } from "./hooks.js";

// ─── Line colorizer ───────────────────────────────────────────────────────────

interface LineStyle {
  color: string;
  isSpecial: boolean;
}

function classifyLine(line: string): LineStyle {
  const trimmed = line.trim();

  // ◈ insight lines → accent.primary
  if (trimmed.startsWith("\u25C8")) {
    return { color: palette.accent.primary, isSpecial: true };
  }
  // ∴ derived lines → accent.pale
  if (trimmed.startsWith("\u2234")) {
    return { color: palette.accent.pale, isSpecial: true };
  }
  // ✗ risk / failure lines → semantic.failure
  if (trimmed.startsWith("\u2717")) {
    return { color: palette.semantic.failure, isSpecial: true };
  }
  // ✓ verified / pass lines → semantic.verified
  if (trimmed.startsWith("\u2713")) {
    return { color: palette.semantic.verified, isSpecial: false };
  }
  // predicate lines (operator + dot notation)
  if (/[><=!]=|[><]/.test(trimmed) && trimmed.includes(".")) {
    return { color: palette.accent.primary, isSpecial: false };
  }
  // quoted text → primary
  if (
    trimmed.startsWith('"') ||
    trimmed.startsWith("'") ||
    trimmed.startsWith("\u201C")
  ) {
    return { color: palette.text.primary, isSpecial: false };
  }
  // default → secondary
  return { color: palette.text.secondary, isSpecial: false };
}

// ─── Single line with flash-on-mount ─────────────────────────────────────────

interface LineItemProps {
  readonly line: string;
  readonly dimmed: boolean;
}

function LineItem({ line, dimmed }: LineItemProps): React.ReactElement {
  const { color: baseColor, isSpecial } = classifyLine(line);

  // flash on mount: special lines get accent flash, others just appear
  const flashTarget = isSpecial ? palette.accent.primary : baseColor;
  const flashedColor = useColorFlash(flashTarget, baseColor, 100);

  const displayColor = dimmed
    ? palette.text.tertiary
    : isSpecial
      ? flashedColor
      : baseColor;

  return (
    <Text color={displayColor} wrap="truncate">
      {"  "}
      {line}
    </Text>
  );
}

// ─── Crystallizing indicator — shown when JSON fence detected ─────────────────

function CrystallizingLine(): React.ReactElement {
  return (
    <Box paddingLeft={2}>
      <Text color={palette.text.dim}>{glyphs.identity.open} </Text>
      <Text color={palette.accent.dim}>{glyphs.pipeline.arrow} </Text>
      <Text color={palette.accent.primary}>{glyphs.identity.core} </Text>
      <Text color={palette.accent.dim}>{glyphs.pipeline.arrow} </Text>
      <Text color={palette.semantic.verified}>{glyphs.identity.filled}</Text>
      <Text color={palette.text.tertiary}>
        {"  crystallizing"}
        {glyphs.pipeline.ellipsis}
      </Text>
    </Box>
  );
}

// ─── Reasoning stream ─────────────────────────────────────────────────────────

interface ReasoningStreamProps {
  readonly tokens: string;
  readonly maxLines?: number | undefined;
}

export function ReasoningStream({
  tokens,
  maxLines = 18,
}: ReasoningStreamProps): React.ReactElement {
  // Detect JSON fence — stop showing text after it
  const fenceIdx = tokens.indexOf("```");
  const preJsonText = fenceIdx > -1 ? tokens.slice(0, fenceIdx) : tokens;
  const jsonFenceDetected = fenceIdx > -1;

  // Split into non-empty lines
  const allLines = preJsonText.split("\n").filter((l) => l.trim().length > 0);

  // Visible window: last maxLines
  const dimThreshold = 8; // lines older than this in the window get dimmed
  const globalOffset = Math.max(0, allLines.length - maxLines);
  const visibleLines = allLines.slice(globalOffset);

  // Track prev line count for flash keying
  const prevCountRef = useRef(0);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (allLines.length > prevCountRef.current) {
      prevCountRef.current = allLines.length;
      forceUpdate((n) => n + 1);
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      {visibleLines.map((line, localIdx) => {
        const globalIdx = globalOffset + localIdx;
        const isDimmed = localIdx < visibleLines.length - dimThreshold;
        return <LineItem key={globalIdx} line={line} dimmed={isDimmed} />;
      })}
      {jsonFenceDetected && <CrystallizingLine />}
    </Box>
  );
}
