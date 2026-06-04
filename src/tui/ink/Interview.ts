/**
 * Interview — the Ink chat UI for `ada ctx init`. A calm, earth-toned back-and-forth: Ada asks
 * one thing (`ada › <question>`), the user answers (`you › <answer>`), Ada follows up. Each
 * turn shows 3–5 pickable options (↑/↓ + ⏎) plus an always-present "✎ type my own…" row that
 * opens a free-text input. The transcript scrolls; the current question sits at the bottom.
 *
 * This component owns NO model/network and NO loop policy — it is a thin renderer driven by
 * two injected callbacks: `getNextStep(seed-less transcript)` returns the next step (the caller
 * wires it to the model + the finite loop, AXIOM A1/A6/A9), and `onFinish(turns)` hands the
 * captured answers back so the caller maps them to the Seed and EXITS. Authored as `.ts` with
 * createElement (the repo excludes `.tsx`), reusing the shared theme.
 */
import { createElement as h, useState, useEffect, useCallback } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { theme } from "./theme.js";
import type {
  InterviewStep,
  InterviewTurn,
} from "../../compile/engine/interview.js";

/** The "type my own" affordance, rendered as the last selectable row. */
const TYPE_MY_OWN = "✎ type my own…";

export interface InterviewProps {
  /** The opening intent (shown as the first `you ›` line and the root of the transcript). */
  rootIntent: string;
  /** Fetch the next step given the turns so far; null/undefined → the interview is over. */
  getNextStep: (
    turns: InterviewTurn[],
  ) => Promise<InterviewStep | null | undefined>;
  /** Called once when the interview ends; the caller maps `turns` to the Seed and exits. */
  onFinish: (turns: InterviewTurn[]) => void;
  /** Hard cap mirror for the header (display only; the loop policy lives in the caller). */
  maxTurns: number;
}

type Phase = "loading" | "picking" | "typing" | "done";

export function Interview(props: InterviewProps) {
  const app = useApp();
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [step, setStep] = useState<InterviewStep | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [selected, setSelected] = useState(0);
  const [buffer, setBuffer] = useState("");

  // The selectable rows for the current step: its options + the "type my own" row.
  const rows = step ? [...step.options, TYPE_MY_OWN] : [];

  const finish = useCallback(
    (finalTurns: InterviewTurn[]) => {
      setPhase("done");
      props.onFinish(finalTurns);
      app.exit();
    },
    [props, app],
  );

  // Fetch the next step whenever the recorded turns change (and at mount). A null step ends
  // the interview — the finite loop / cap lives in the injected getNextStep (A6/A9).
  const fetchNext = useCallback(
    async (currentTurns: InterviewTurn[]) => {
      setPhase("loading");
      const next = await props.getNextStep(currentTurns);
      if (!next || !next.question || next.done) {
        finish(currentTurns);
        return;
      }
      setStep(next);
      setSelected(0);
      setBuffer("");
      setPhase("picking");
    },
    [props, finish],
  );

  useEffect(() => {
    void fetchNext([]);
    // Mount-only: subsequent fetches are triggered explicitly after each answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = useCallback(
    (answer: string) => {
      const text = answer.trim();
      if (!step || !text) return;
      const next = [...turns, { step, answer: text }];
      setTurns(next);
      void fetchNext(next);
    },
    [step, turns, fetchNext],
  );

  useInput(
    (input, key) => {
      if (phase === "loading" || phase === "done") {
        if (input === "q" || (key.ctrl && input === "c")) finish(turns);
        return;
      }

      if (phase === "typing") {
        if (key.return) {
          if (buffer.trim()) submit(buffer);
          return;
        }
        if (key.escape) {
          setBuffer("");
          setPhase("picking");
          return;
        }
        if (key.backspace || key.delete) {
          setBuffer((b) => b.slice(0, -1));
          return;
        }
        if (input && !key.ctrl && !key.meta) setBuffer((b) => b + input);
        return;
      }

      // phase === "picking"
      if (key.upArrow) {
        setSelected((i) => (i - 1 + rows.length) % rows.length);
        return;
      }
      if (key.downArrow) {
        setSelected((i) => (i + 1) % rows.length);
        return;
      }
      if (key.return) {
        const choice = rows[selected];
        if (choice === TYPE_MY_OWN) {
          setPhase("typing");
        } else if (choice) {
          submit(choice);
        }
        return;
      }
      if (input === "q") finish(turns);
    },
    { isActive: phase !== "done" },
  );

  // ── render ──────────────────────────────────────────────────────────────────
  const transcript: ReturnType<typeof h>[] = [];
  transcript.push(
    h(
      Text,
      { key: "intent" },
      h(Text, { color: theme.cyan }, "you › "),
      h(Text, null, props.rootIntent),
    ),
  );
  turns.forEach((t, i) => {
    transcript.push(
      h(
        Text,
        { key: `q${i}` },
        h(Text, { color: theme.terracotta }, "ada › "),
        h(Text, null, t.step.question),
      ),
      h(
        Text,
        { key: `a${i}` },
        h(Text, { color: theme.cyan }, "you › "),
        h(Text, null, t.answer),
      ),
    );
  });

  const header = h(
    Text,
    { key: "hdr", color: theme.ink },
    `⟦ ctx init ⟧  capturing what you expect before we compile · ≤ ${props.maxTurns} questions · q to quit`,
  );

  let current: ReturnType<typeof h>;
  if (phase === "loading") {
    current = h(Text, { key: "loading", color: theme.ink }, "ada › …thinking");
  } else if (phase === "done") {
    current = h(
      Text,
      { key: "done", color: theme.green },
      "✓ captured — compiling your context",
    );
  } else if (step) {
    const optionRows = rows.map((row, i) => {
      const isSel = i === selected && phase === "picking";
      const isTypeRow = row === TYPE_MY_OWN;
      return h(
        Text,
        {
          key: `opt${i}`,
          color: isTypeRow ? theme.plum : isSel ? theme.amber : undefined,
          bold: isSel,
        },
        (isSel ? "  ❯ " : "    ") + row,
      );
    });
    const questionLine = h(
      Text,
      { key: "cur-q" },
      h(Text, { color: theme.terracotta }, "ada › "),
      h(Text, { bold: true }, step.question),
    );
    const footer =
      phase === "typing"
        ? h(
            Text,
            { key: "typing" },
            h(Text, { color: theme.cyan }, "you › "),
            h(Text, null, buffer),
            h(Text, { color: theme.ink }, "▏"),
            h(Text, { color: theme.ink }, "   (⏎ to send · esc to pick)"),
          )
        : h(
            Text,
            { key: "hint", color: theme.ink },
            "↑/↓ choose · ⏎ pick · the ✎ row lets you type your own",
          );
    current = h(
      Box,
      { key: "current", flexDirection: "column" },
      questionLine,
      h(Box, { flexDirection: "column" }, ...optionRows),
      footer,
    );
  } else {
    current = h(Text, { key: "idle" }, " ");
  }

  return h(
    Box,
    { flexDirection: "column" },
    header,
    h(Text, { key: "gap" }, " "),
    h(Box, { flexDirection: "column" }, ...transcript),
    h(Text, { key: "gap2" }, " "),
    current,
  );
}
