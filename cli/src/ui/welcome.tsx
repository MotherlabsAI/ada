import React, { useState } from "react";
import { Text, Box, useInput, useApp } from "ink";
import { palette, glyphs } from "./design-system.js";
import { useDiamondBreathe } from "./hooks.js";

// ─── Ada Welcome Screen ───────────────────────────────────────────────────────
//
// Rendered on `ada` or `ada compile` with no intent argument.
// Captures intent input interactively, then calls onSubmit.
// Unmounts before compilation begins.
//
// Design invariants (docs/UI_LAUNCH.md):
//   — header: double border, animated ◈, matches runtime compile header
//   — context panel: recognition → mechanism → trust (never product-framing)
//   — pipeline row: all 8 stages pending (◇) + output arrow + produced artifacts
//   — "not zero. less." is the trust signal — present, not buried, not prominent
//   — input panel: single border, activates on type
//   — vocabulary: never "semantic compiler" (BRAND.md)
//

const VERSION = "0.1.0";

// Ada's voice: lowercase, imperative, no question mark.
// Not "what do you want?" — more like a compiler waiting for its input.
const PLACEHOLDER = "describe what you\u2019re building";

// All 8 pipeline stages — shown as pending at launch.
// Gives the user the mechanism before they commit their intent.
const PIPELINE_STAGES = [
  "CTX",
  "INT",
  "PER",
  "ENT",
  "PRO",
  "SYN",
  "VER",
  "GOV",
] as const;

interface WelcomeScreenProps {
  readonly onSubmit: (intent: string) => void;
}

export function WelcomeScreen({
  onSubmit,
}: WelcomeScreenProps): React.ReactElement {
  const [input, setInput] = useState("");
  const { exit } = useApp();
  const cwd = process.cwd();
  const diamond = useDiamondBreathe();

  useInput((char, key) => {
    if (key.return) {
      onSubmit(input.trim());
      exit();
    } else if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1));
    } else if (key.escape) {
      exit();
      process.exit(0);
    } else if (!key.ctrl && !key.meta && char) {
      setInput((prev) => prev + char);
    }
  });

  // Truncate cwd from the right — confirms context, doesn't compete
  const cwdDisplay = cwd.length > 42 ? "\u2026" + cwd.slice(-41) : cwd;

  return (
    <Box flexDirection="column" paddingLeft={1} paddingTop={1}>
      {/* ── Header — double border, matches runtime compile header ────── */}
      <Box
        borderStyle="double"
        borderColor={palette.accent.dim}
        paddingX={1}
        justifyContent="space-between"
      >
        <Box>
          <Text color={palette.accent.primary}>{diamond} </Text>
          <Text bold color={palette.text.primary}>
            ada
          </Text>
          <Text color={palette.text.dim}> v{VERSION}</Text>
        </Box>
        <Text color={palette.text.tertiary}>by motherlabs</Text>
      </Box>

      {/* ── Context panel — recognition → mechanism → trust ───────────── */}
      {/*                                                                   */}
      {/* Each zone answers one question:                                   */}
      {/*   recognition: "do you understand my problem?"                    */}
      {/*   mechanism:   "what will you do about it?"                       */}
      {/*   trust:       "can I trust the result?"                          */}
      <Box
        borderStyle="single"
        borderColor={palette.text.ghost}
        flexDirection="column"
        paddingX={1}
      >
        {/* Recognition — core claim language (locked in BRAND.md) */}
        <Box flexDirection="column">
          <Text color={palette.text.secondary}>
            between what you mean and what gets built,
          </Text>
          <Text color={palette.text.secondary}>something gets lost.</Text>
        </Box>

        <Text>{""}</Text>

        {/* Mechanism — 8 stages pending, output they produce */}
        <Box flexWrap="nowrap">
          {PIPELINE_STAGES.map((stage, i) => (
            <Box key={stage}>
              <Text color={palette.text.tertiary}>{stage} </Text>
              <Text color={palette.text.dim}>{glyphs.identity.open}</Text>
              {i < PIPELINE_STAGES.length - 1 && (
                <Text color={palette.text.ghost}>{"  "}</Text>
              )}
            </Box>
          ))}
        </Box>

        {/* Output — closes the loop: ∴ = "therefore these artifacts" */}
        {/* Uses ∴ (glyphs.pipeline.therefore) — no fixed-pixel alignment */}
        <Box>
          <Text color={palette.text.dim}>
            {glyphs.pipeline.therefore}
            {"  "}
          </Text>
          <Text color={palette.accent.dim}>CLAUDE.md</Text>
          <Text color={palette.text.ghost}>{" \u00B7 "}</Text>
          <Text color={palette.accent.dim}>agents/</Text>
          <Text color={palette.text.ghost}>{" \u00B7 "}</Text>
          <Text color={palette.accent.dim}>hooks/</Text>
        </Box>

        <Text>{""}</Text>

        {/* Trust signal — honest limitation, DESIGN_PSYCHOLOGY.md invariant */}
        <Text color={palette.text.dim}>not zero. less.</Text>
      </Box>

      {/* ── Input panel — border activates on type ────────────────────── */}
      <Box
        borderStyle="single"
        borderColor={input.length > 0 ? palette.accent.dim : palette.text.ghost}
        paddingX={1}
      >
        <Text color={palette.accent.primary}>{glyphs.chevron} </Text>
        {input.length === 0 ? (
          <>
            <Text color={palette.text.dim}>{PLACEHOLDER}</Text>
            <Text color={palette.accent.dim}>{"\u2588"}</Text>
          </>
        ) : (
          <>
            <Text color={palette.text.primary}>{input}</Text>
            <Text color={palette.accent.primary}>{"\u2588"}</Text>
          </>
        )}
      </Box>

      {/* ── Footer — keybinds left, cwd right ────────────────────────── */}
      <Box paddingX={2} justifyContent="space-between">
        <Box>
          <Text color={palette.text.dim}>esc </Text>
          <Text color={palette.text.ghost}>{glyphs.pipeline.separator} </Text>
          <Text color={palette.text.dim}>exit</Text>
          <Text color={palette.text.ghost}>{"    "}</Text>
          <Text color={palette.text.dim}>enter </Text>
          <Text color={palette.text.ghost}>{glyphs.pipeline.separator} </Text>
          <Text color={palette.text.dim}>compile</Text>
        </Box>
        <Text color={palette.text.dim}>{cwdDisplay}</Text>
      </Box>
    </Box>
  );
}
