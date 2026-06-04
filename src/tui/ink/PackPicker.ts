/**
 * PackPicker — the small earth-toned arrow-select list shown when "Open a pack" finds more
 * than one pack on disk. Recognition over recall: the packs are SHOWN with their counts, the
 * focused row pops in the accent, ⏎ opens it, esc/b returns to the menu.
 *
 * A pure renderer over `listPacks()` output (PackSummary[]). No model, no I/O, no timers — so
 * there is nothing to unref and nothing to hang the suite. Earth-tone role `tokens` only.
 * Authored as `.ts` with createElement (the repo excludes `.tsx`).
 */
import { createElement as h, useState } from "react";
import { Box, Text, useInput } from "ink";
import { tokens } from "./theme.js";
import type { PackSummary } from "./usePack.js";

export interface PackPickerProps {
  packs: PackSummary[];
  /** Open the chosen pack's graph. */
  onPick: (slug: string) => void;
  /** Back to the home menu (esc / b). */
  onCancel: () => void;
}

export function PackPicker(p: PackPickerProps) {
  const [selected, setSelected] = useState(0);
  const n = p.packs.length;

  useInput((input, key) => {
    if (key.escape || input === "b") return p.onCancel();
    if (key.downArrow) return setSelected((i) => (i + 1) % n);
    if (key.upArrow) return setSelected((i) => (i - 1 + n) % n);
    if (key.return) {
      const pick = p.packs[selected];
      if (pick) p.onPick(pick.slug);
    }
  });

  const rows = p.packs.map((pk, i) => {
    const sel = i === selected;
    return h(
      Box,
      { key: "pk" + i, flexDirection: "row" },
      h(
        Box,
        { width: 30 },
        h(
          Text,
          {
            backgroundColor: sel ? tokens.selection : undefined,
            color: sel ? tokens.accent : tokens.textDim,
            bold: sel,
            wrap: "truncate-end",
          },
          `${sel ? "❯" : " "} ◈ ${pk.slug}`,
        ),
      ),
      h(
        Text,
        { color: tokens.textMuted, wrap: "truncate-end" },
        ` ${pk.nodes} nodes · κ ${pk.checks} · Ω ${pk.residue} · ${pk.clusters} areas`,
      ),
    );
  });

  return h(
    Box,
    { flexDirection: "column", paddingX: 1, paddingY: 1 },
    h(Text, { color: tokens.textMuted }, "OPEN A PACK"),
    h(Text, { key: "g1" }, " "),
    h(Text, { color: tokens.text }, "Pick a pack to open its graph."),
    h(Text, { key: "g2" }, " "),
    h(Box, { flexDirection: "column" }, ...rows),
    h(Text, { key: "g3" }, " "),
    h(Text, { color: tokens.textMuted }, "↑/↓ move · ⏎ open · esc back"),
  );
}
