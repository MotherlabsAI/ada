/**
 * IntentInput — the calm, earth-toned text field where the home's "Compile an idea" flow
 * collects ONE sentence of intent before handing it to the shared `engineCompile` seam.
 *
 * Recognition over recall: a labeled field, a soft prompt, a blinking caret, and the two keys
 * that matter (⏎ compile · esc back). No restyle — it reuses the approved 60/30/10 role
 * `tokens` and the same blink cadence as the Welcome eye (open ~530ms / shut ~140ms), every
 * timer unref'd so `node --test` never hangs. Owns NO model/network — it only gathers text and
 * calls back. Authored as `.ts` with createElement (the repo excludes `.tsx`).
 */
import { createElement as h, useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { tokens } from "./theme.js";

export interface IntentInputProps {
  /** Pre-fill (e.g. resuming a draft). Defaults to empty. */
  initial?: string;
  /** Submit the trimmed intent (⏎). No-op on empty so we never compile nothing. */
  onSubmit: (intent: string) => void;
  /** Back to the home menu (esc). */
  onCancel: () => void;
}

export function IntentInput(p: IntentInputProps) {
  const [buffer, setBuffer] = useState(p.initial ?? "");
  const [caret, setCaret] = useState(true);

  // Caret blink — same calm cadence as the Welcome eye; the handle is unref'd (no hang).
  useEffect(() => {
    const t = setInterval(() => setCaret((c) => !c), 530);
    (t as { unref?: () => void }).unref?.();
    return () => clearInterval(t);
  }, []);

  useInput((input, key) => {
    if (key.escape) return p.onCancel();
    if (key.return) {
      const text = buffer.trim();
      if (text) p.onSubmit(text);
      return;
    }
    if (key.backspace || key.delete) {
      setBuffer((b) => b.slice(0, -1));
      return;
    }
    // Plain printable input only (ignore ctrl/meta chord bytes).
    if (input && !key.ctrl && !key.meta) setBuffer((b) => b + input);
  });

  const empty = buffer.trim().length === 0;
  return h(
    Box,
    { flexDirection: "column", paddingX: 1, paddingY: 1 },
    h(Text, { color: tokens.textMuted }, "COMPILE AN IDEA"),
    h(Text, { key: "g1" }, " "),
    h(
      Text,
      { color: tokens.text },
      "Describe what you want, in a sentence. Ada compiles it into a governed context pack.",
    ),
    h(Text, { key: "g2" }, " "),
    // The field: a soft prompt glyph + the typed text + a blinking caret block.
    h(
      Box,
      { flexDirection: "row" },
      h(Text, { color: tokens.accent }, "❯ "),
      h(
        Text,
        { color: empty ? tokens.textMuted : tokens.text },
        empty ? "a tool I want to build…" : buffer,
      ),
      h(Text, { color: tokens.accentBright }, caret ? "▏" : " "),
    ),
    h(Text, { key: "g3" }, " "),
    h(
      Text,
      { color: tokens.textMuted },
      "⏎ compile · esc back · type your intent",
    ),
  );
}
