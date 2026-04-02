import React, { useState, useEffect } from "react";
import { Text, Box, useInput, useApp, useStdout } from "ink";
import { palette, glyphs } from "./design-system.js";

// ─── Ada Welcome Screen ───────────────────────────────────────────────────────
//
// No outer card. Three one-time animations fire in sequence, then static forever:
//   1. Diamond crystallizes center-outward (200ms, 60ms/ring, done ~440ms)
//   2. Pipeline rows build top-to-bottom (500ms, 70ms/row, done ~920ms)
//   3. One shimmer sweep across pipeline rows (1100ms, 55ms/row, done ~1485ms)
//
// Wide (>=80): diamond left | pipeline panel right (9 rows each, center-aligned)
//   Diamond center ◆ sits beside ENT "crystallize" — intentional poetry.
// Narrow: stacked, questions omitted.

const VERSION = "0.1.10";
const PLACEHOLDER = "describe what you\u2019re building";
const VERB_WIDTH = 12; // "choreograph" = 11, pad to 12

// ─── Pipeline: the mechanism shown before intent ──────────────────────────────
// 7 entries (INT→GOV). In wide mode, aligns row-for-row with diamond rows 2–8.
// Diamond rows 0–1 align with brand text. Diamond row 4 (◆ center) = ENT.
interface PipelineEntry {
  readonly code: string;
  readonly verb: string;
  readonly q: string;
}
const PIPELINE: readonly PipelineEntry[] = [
  { code: "INT", verb: "excavate", q: "what do you want?" },
  { code: "PER", verb: "situate", q: "in what world?" },
  { code: "ENT", verb: "crystallize", q: "what things exist?" },
  { code: "PRO", verb: "choreograph", q: "what happens?" },
  { code: "SYN", verb: "compose", q: "how do they fit?" },
  { code: "VER", verb: "challenge", q: "is that right?" },
  { code: "GOV", verb: "govern", q: "does this meet the bar?" },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Diamond ring reveal: center-outward, 60ms per ring. Returns step 0–5. */
function useDiamondReveal(): number {
  const [step, setStep] = useState(0);
  useEffect(() => {
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = (): void => {
      i++;
      setStep(i);
      if (i < 5) timer = setTimeout(next, 60);
    };
    timer = setTimeout(next, 200);
    return () => clearTimeout(timer);
  }, []);
  return step; // row i visible when step >= Math.abs(i - 4) + 1
}

/** Pipeline row reveal: top-to-bottom, 70ms per row. Returns visible count. */
function usePipelineReveal(count: number): number {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    let current = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = (): void => {
      current++;
      setVisible(current);
      if (current < count) timer = setTimeout(next, 70);
    };
    timer = setTimeout(next, 500);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return visible;
}

/** One-time sweep across pipeline rows. Returns lit index (-1 = none). */
function usePipelineSweep(count: number, startMs: number): number {
  const [lit, setLit] = useState(-1);
  useEffect(() => {
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const advance = (): void => {
      if (i < count) {
        setLit(i);
        i++;
        timer = setTimeout(advance, 55);
      } else {
        setLit(-1);
        // sweep complete — no further timers
      }
    };
    timer = setTimeout(advance, startMs);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return lit;
}

// ─── Diamond ──────────────────────────────────────────────────────────────────

function DiamondLine({ row }: { row: number }): React.ReactElement {
  const og = palette.text.ghost;
  const id = palette.accent.dim;
  const cn = palette.accent.primary;
  const s = (n: number): string => " ".repeat(n);

  if (row === 0 || row === 8)
    return (
      <Text>
        {s(9)}
        <Text color={og}>{"◇"}</Text>
      </Text>
    );
  if (row === 1 || row === 7)
    return (
      <Text>
        {s(7)}
        <Text color={og}>{"◇"}</Text>
        {s(3)}
        <Text color={og}>{"◇"}</Text>
      </Text>
    );
  if (row === 2 || row === 6)
    return (
      <Text>
        {s(5)}
        <Text color={og}>{"◇"}</Text>
        {s(3)}
        <Text color={id}>{"◈"}</Text>
        {s(3)}
        <Text color={og}>{"◇"}</Text>
      </Text>
    );
  if (row === 3 || row === 5)
    return (
      <Text>
        {s(3)}
        <Text color={og}>{"◇"}</Text>
        {s(3)}
        <Text color={id}>{"◈"}</Text>
        {s(3)}
        <Text color={id}>{"◈"}</Text>
        {s(3)}
        <Text color={og}>{"◇"}</Text>
      </Text>
    );
  // row 4 — center, static ◆
  return (
    <Text>
      {s(1)}
      <Text color={og}>{"◇"}</Text>
      {s(3)}
      <Text color={id}>{"◈"}</Text>
      {s(3)}
      <Text color={cn}>{"◆"}</Text>
      {s(3)}
      <Text color={id}>{"◈"}</Text>
      {s(3)}
      <Text color={og}>{"◇"}</Text>
    </Text>
  );
}

function Diamond({ step }: { step: number }): React.ReactElement {
  const visible = (row: number): boolean => step >= Math.abs(row - 4) + 1;
  return (
    <Box flexDirection="column">
      {Array.from({ length: 9 }, (_, i) => (
        <Box key={i}>
          {visible(i) ? <DiamondLine row={i} /> : <Text> </Text>}
        </Box>
      ))}
    </Box>
  );
}

// ─── Pipeline entry ───────────────────────────────────────────────────────────

interface PipelineEntryProps {
  readonly entry: PipelineEntry;
  readonly isLit: boolean;
  readonly wide: boolean;
}

function PEntry({
  entry,
  isLit,
  wide,
}: PipelineEntryProps): React.ReactElement {
  const codeColor = isLit ? palette.accent.primary : palette.text.secondary;
  const verbColor = isLit ? palette.text.primary : palette.accent.dim;
  const qColor = isLit ? palette.text.secondary : palette.text.ghost;

  if (!wide) {
    return (
      <Text>
        <Text color={codeColor}>{entry.code}</Text>
        {"  "}
        <Text color={verbColor}>{entry.verb}</Text>
      </Text>
    );
  }
  return (
    <Text>
      <Text color={codeColor}>{entry.code}</Text>
      {"  "}
      <Text color={verbColor}>{entry.verb.padEnd(VERB_WIDTH)}</Text>
      {"  "}
      <Text color={qColor}>
        {"\u201C"}
        {entry.q}
        {"\u201D"}
      </Text>
    </Text>
  );
}

// ─── Pipeline panel (right side of header in wide mode) ───────────────────────
// 9 rows total: brand (2) + pipeline entries (7). Height-lock placeholders keep
// the panel the same height as the diamond during the reveal animation.

interface PipelinePanelProps {
  readonly visible: number;
  readonly litRow: number;
  readonly wide: boolean;
}

function PipelinePanel({
  visible,
  litRow,
  wide,
}: PipelinePanelProps): React.ReactElement {
  return (
    <Box flexDirection="column" flexShrink={0}>
      {/* rows 0–1: brand */}
      <Text bold color={palette.text.primary}>
        {"a  d  a"}
      </Text>
      <Text color={palette.text.ghost}>{"◈ motherlabs"}</Text>
      {/* rows 2–8: pipeline entries, reveal top-to-bottom */}
      {PIPELINE.map((entry, i) =>
        visible > i ? (
          <PEntry
            key={entry.code}
            entry={entry}
            isLit={litRow === i}
            wide={wide}
          />
        ) : (
          // height-lock: keeps the panel height stable while rows are hidden
          <Text key={entry.code}> </Text>
        ),
      )}
    </Box>
  );
}

// ─── Rule: ◇ ───────────────── ◇ ─────────────────────────────────────────────

interface RuleProps {
  readonly cols: number;
  readonly active: boolean;
  readonly padLeft: number;
}

function Rule({ cols, active, padLeft }: RuleProps): React.ReactElement {
  const innerW = Math.max(2, cols - padLeft - 8);
  const line = "\u2500".repeat(innerW);
  const diaColor = active ? palette.accent.dim : palette.text.tertiary;
  const lineColor = active ? palette.accent.primary : palette.text.ghost;
  return (
    <Text>
      <Text color={diaColor}>{"◇ "}</Text>
      <Text color={lineColor}>{line}</Text>
      <Text color={diaColor}>{" ◇"}</Text>
    </Text>
  );
}

// ─── Input field ──────────────────────────────────────────────────────────────

interface InputFieldProps {
  readonly input: string;
  readonly active: boolean;
}

function InputField({ input, active }: InputFieldProps): React.ReactElement {
  return (
    <Box paddingLeft={3} paddingY={1}>
      <Text color={active ? palette.accent.primary : palette.text.tertiary}>
        {glyphs.chevron}{" "}
      </Text>
      {input.length === 0 ? (
        <>
          <Text color={palette.text.dim}>{PLACEHOLDER}</Text>
          <Text color={palette.text.ghost}>{"\u2588"}</Text>
        </>
      ) : (
        <>
          <Text color={palette.text.primary}>{input}</Text>
          <Text color={palette.accent.primary}>{"\u2588"}</Text>
        </>
      )}
    </Box>
  );
}

// ─── Artifact row: what Ada produces ─────────────────────────────────────────

function ArtifactRow(): React.ReactElement {
  const sep = <Text color={palette.text.ghost}>{"  \u00B7  "}</Text>;
  const item = (label: string, dim?: boolean): React.ReactElement => (
    <Text color={dim ? palette.text.dim : palette.accent.dim}>{label}</Text>
  );
  return (
    <Text>
      <Text color={palette.text.ghost}>
        {glyphs.pipeline.therefore}
        {"  "}
      </Text>
      {item("CLAUDE.md")}
      {sep}
      {item("agents/")}
      {sep}
      {item("hooks/")}
      {sep}
      {item(".ada/state.json", true)}
    </Text>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

interface FooterProps {
  readonly cwdDisplay: string;
}

function Footer({ cwdDisplay }: FooterProps): React.ReactElement {
  return (
    <Box justifyContent="space-between">
      <Box gap={2}>
        <Box gap={1}>
          <Text color={palette.text.tertiary}>esc</Text>
          <Text color={palette.text.ghost}>{glyphs.pipeline.separator}</Text>
          <Text color={palette.text.dim}>exit</Text>
        </Box>
        <Box gap={1}>
          <Text color={palette.text.tertiary}>enter</Text>
          <Text color={palette.text.ghost}>{glyphs.pipeline.separator}</Text>
          <Text color={palette.text.dim}>compile</Text>
        </Box>
      </Box>
      <Box gap={1}>
        <Text color={palette.text.ghost}>{"◈"}</Text>
        <Text color={palette.text.ghost}>ada {VERSION}</Text>
        <Text color={palette.text.ghost}>{glyphs.pipeline.separator}</Text>
        <Text color={palette.text.dim}>{cwdDisplay}</Text>
      </Box>
    </Box>
  );
}

// ─── Welcome screen ───────────────────────────────────────────────────────────

interface WelcomeScreenProps {
  readonly onSubmit: (intent: string) => void;
}

export function WelcomeScreen({
  onSubmit,
}: WelcomeScreenProps): React.ReactElement {
  const [input, setInput] = useState("");
  const { exit } = useApp();
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;
  const wide = cols >= 80;
  const padLeft = wide ? 2 : 1;

  const revealStep = useDiamondReveal();
  const pipelineRows = usePipelineReveal(PIPELINE.length);
  // sweep starts after pipeline is fully visible: 500 + 7*70 + 80 = 1070ms
  const litRow = usePipelineSweep(PIPELINE.length, 1070);

  const cwd = process.cwd();
  const maxCwdLen = wide ? 36 : cols - 18;
  const cwdDisplay =
    cwd.length > maxCwdLen ? "\u2026" + cwd.slice(-(maxCwdLen - 1)) : cwd;

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

  const active = input.length > 0;

  // ── Wide layout (>=80 cols) ───────────────────────────────────────────────
  if (wide) {
    return (
      <Box paddingLeft={2} paddingTop={1} flexDirection="column">
        {/* Header: diamond (19w) + pipeline panel (9 rows each) */}
        <Box flexDirection="row" gap={4} alignItems="flex-start">
          <Diamond step={revealStep} />
          <PipelinePanel visible={pipelineRows} litRow={litRow} wide={true} />
        </Box>

        <Text>{""}</Text>
        <Rule cols={cols} active={active} padLeft={padLeft} />
        <InputField input={input} active={active} />
        <Rule cols={cols} active={active} padLeft={padLeft} />

        <Box paddingTop={1}>
          <ArtifactRow />
        </Box>
        <Box paddingTop={1}>
          <Footer cwdDisplay={cwdDisplay} />
        </Box>
      </Box>
    );
  }

  // ── Narrow layout (<80 cols) ──────────────────────────────────────────────
  return (
    <Box paddingLeft={1} paddingTop={1} flexDirection="column">
      <Diamond step={revealStep} />

      <Box paddingTop={1} flexDirection="column">
        <Text bold color={palette.text.primary}>
          {"a  d  a"}
        </Text>
        <Text color={palette.text.ghost}>{"◈ motherlabs"}</Text>
      </Box>

      <Box paddingTop={1} flexDirection="column">
        {PIPELINE.map((entry, i) =>
          i < pipelineRows ? (
            <PEntry
              key={entry.code}
              entry={entry}
              isLit={litRow === i}
              wide={false}
            />
          ) : null,
        )}
      </Box>

      <Box paddingTop={1} flexDirection="column">
        <Rule cols={cols} active={active} padLeft={padLeft} />
        <InputField input={input} active={active} />
        <Rule cols={cols} active={active} padLeft={padLeft} />
      </Box>

      <Box paddingTop={1}>
        <ArtifactRow />
      </Box>
      <Box paddingTop={1}>
        <Footer cwdDisplay={cwdDisplay} />
      </Box>
    </Box>
  );
}
