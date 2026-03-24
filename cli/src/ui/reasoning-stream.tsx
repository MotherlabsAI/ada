import React, { useRef, useState, useEffect } from "react";
import { Text, Box, useInput } from "ink";
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
    <Text color={displayColor} wrap="wrap">
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

  // Scroll state: 0 = auto-follow (bottom), N = N lines scrolled up from bottom
  const [scrollOffset, setScrollOffset] = useState(0);
  const prevCountRef = useRef(0);
  const [, forceUpdate] = useState(0);

  // When new lines arrive and we're auto-following, stay at bottom
  useEffect(() => {
    if (allLines.length > prevCountRef.current) {
      prevCountRef.current = allLines.length;
      if (scrollOffset === 0) forceUpdate((n) => n + 1);
    }
  });

  // Arrow key scroll — up/down only, don't capture q/r/esc
  useInput((_input, key) => {
    if (key.upArrow) {
      setScrollOffset((prev) =>
        Math.min(prev + 1, Math.max(0, allLines.length - maxLines)),
      );
    }
    if (key.downArrow) {
      setScrollOffset((prev) => Math.max(0, prev - 1));
    }
  });

  // Compute visible window
  const dimThreshold = 8;
  const bottomIdx = allLines.length; // exclusive
  const windowEnd = bottomIdx - scrollOffset;
  const windowStart = Math.max(0, windowEnd - maxLines);
  const visibleLines = allLines.slice(windowStart, windowEnd);
  const hiddenAbove = windowStart;
  const hiddenBelow = scrollOffset;

  return (
    <Box flexDirection="column" paddingX={1}>
      {hiddenAbove > 0 && (
        <Text color={palette.text.dim}>
          {"  "}↑ {hiddenAbove} line{hiddenAbove !== 1 ? "s" : ""} above
        </Text>
      )}
      {visibleLines.map((line, localIdx) => {
        const globalIdx = windowStart + localIdx;
        const isDimmed =
          scrollOffset === 0 && localIdx < visibleLines.length - dimThreshold;
        return <LineItem key={globalIdx} line={line} dimmed={isDimmed} />;
      })}
      {jsonFenceDetected && <CrystallizingLine />}
      {hiddenBelow > 0 && (
        <Text color={palette.text.dim}>
          {"  "}↓ {hiddenBelow} line{hiddenBelow !== 1 ? "s" : ""} below
        </Text>
      )}
    </Box>
  );
}
