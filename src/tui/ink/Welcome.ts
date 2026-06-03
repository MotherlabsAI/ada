/**
 * Welcome — the opening page, full-window. Claude Code's sister: the card (ADA wordmark +
 * mascot + pack stats) is vertically + horizontally centered in the whole terminal, with a
 * chat-style input line and command bar pinned at the bottom. Adaptive to terminal size.
 */
import { createElement as h, useState, useEffect } from "react";
import { Box, Text } from "ink";
import { theme } from "./theme.js";
import {
  WORDMARK,
  WORDMARK_TAG,
  gradient,
  mascotFrame,
  DEFAULT_MASCOT,
} from "./art.js";

export interface WelcomeProps {
  slug: string;
  nodes: number;
  checks: number;
  residue: number;
  clusters: number;
  cols: number;
  rows: number;
  mascotName?: string;
}

export function Welcome(p: WelcomeProps) {
  // The mascot is alive: the eye blinks on a calm cadence (open ~3.8s, shut ~140ms).
  // setTimeout chain → exactly two re-renders per blink, so Ink only redraws the
  // one changed row. Other mascots are static, so this is inert for them.
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    // unref so the self-rescheduling blink never keeps the event loop alive on its
    // own (otherwise `node --test` hangs at exit). In a TTY, Ink's stdin handle keeps
    // the process running, so the timer still fires and the eye still blinks.
    const arm = (fn: () => void, ms: number) => {
      timer = setTimeout(fn, ms);
      (timer as { unref?: () => void }).unref?.();
    };
    const open = () => {
      setBlink(false);
      arm(close, 3800);
    };
    const close = () => {
      setBlink(true);
      arm(open, 140);
    };
    arm(close, 3800);
    return () => clearTimeout(timer);
  }, []);

  const m = mascotFrame(p.mascotName, blink);
  // The watcher gets the cyan accent (same as ◈ pack / "context"); others stay plum.
  const mascotColour =
    (p.mascotName ?? DEFAULT_MASCOT) === "eye" ? theme.cyan : theme.plum;
  const grad = gradient(WORDMARK.length, theme.terracotta, theme.plum);
  const cardW = Math.max(40, Math.min(p.cols - 8, 88));
  const height = Math.max(8, p.rows - 1);

  return h(
    Box,
    { flexDirection: "column", height },
    // Centered card region — fills all space above the pinned bottom rows.
    h(
      Box,
      {
        flexGrow: 1,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      },
      h(
        Box,
        {
          flexDirection: "column",
          borderStyle: "round",
          borderColor: theme.terracotta,
          paddingX: 3,
          paddingY: 1,
          width: cardW,
        },
        ...WORDMARK.map((l, i) =>
          h(Text, { key: "w" + i, color: grad[i], bold: true }, l),
        ),
        h(Text, { key: "tag", color: theme.cyan }, WORDMARK_TAG),
        h(Text, { key: "gap" }, " "),
        h(
          Box,
          { key: "row", flexDirection: "row" },
          h(
            Box,
            { flexDirection: "column", marginRight: 3 },
            ...m.map((l, i) =>
              h(Text, { key: "m" + i, color: mascotColour }, l),
            ),
          ),
          h(
            Box,
            { flexDirection: "column" },
            h(Text, { key: "hi", bold: true }, "Welcome back, Alex"),
            h(
              Text,
              { key: "tag", color: theme.ink },
              "a semantic compiler for context",
            ),
          ),
        ),
        h(Text, { key: "gap2" }, " "),
        h(Text, { key: "pack", color: theme.cyan }, `◈ ${p.slug}`),
        h(
          Text,
          { key: "stats", color: theme.ink },
          `${p.nodes} nodes · κ ${p.checks} · Ω ${p.residue} residue · ${p.clusters} areas`,
        ),
      ),
      h(Text, { key: "enter", color: theme.ink }, "press ⏎ to open the graph"),
    ),
    // Pinned bottom: chat input + command bar.
    h(Text, { key: "input" }, " ❯ ask about your context, or open the graph…"),
    h(
      Text,
      { key: "bar", color: theme.ink },
      "   open graph ⏎  ·  commands /  ·  flagged  ·  export  ·  quit q",
    ),
  );
}
