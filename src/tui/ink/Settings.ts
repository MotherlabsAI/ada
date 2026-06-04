/**
 * Settings — a small, read-only earth-toned panel. Shows, value-free (AXIOM A9 — the secret
 * is NEVER rendered, only its availability), the same status `ada key` reports:
 *   • ANTHROPIC_API_KEY availability (a ✓/✗, never the value),
 *   • the active model (ADA_MODEL override or the built-in default),
 *   • where the key is read from (the precedence order),
 * plus the active pack. Esc / b returns to the menu.
 *
 * Pure renderer: the host computes the (value-free) status and passes it in, so this file
 * touches no env, no model, no I/O — and a test can assert the panel without secrets. Earth-tone
 * role `tokens` only; no timers. Authored as `.ts` with createElement (the repo excludes `.tsx`).
 */
import { createElement as h } from "react";
import { Box, Text, useInput } from "ink";
import { tokens } from "./theme.js";

export interface SettingsProps {
  /** Is ANTHROPIC_API_KEY present? Value-free — only the boolean crosses this boundary (A9). */
  keyAvailable: boolean;
  /** The active model id (ADA_MODEL override, else the built-in default). */
  model: string;
  /** True when the model id came from ADA_MODEL (vs the built-in default) — a small annotation. */
  modelFromEnv: boolean;
  /** The active pack slug (context). */
  slug: string;
  /** Back to the home menu (esc / b). */
  onBack: () => void;
}

/** The key precedence Ada uses, shown verbatim so it matches `ada key`'s guidance. */
const KEY_SOURCES = "your shell env · ./.env · ~/.ada/.env (first wins)";

export function Settings(p: SettingsProps) {
  useInput((input, key) => {
    if (key.escape || input === "b") p.onBack();
  });

  const row = (label: string, value: string, colour: string) =>
    h(
      Box,
      { key: label, flexDirection: "row" },
      h(Box, { width: 16 }, h(Text, { color: tokens.textMuted }, label)),
      h(Text, { color: colour }, value),
    );

  const keyLine = p.keyAvailable
    ? row("API key", "✓ available", tokens.success)
    : row("API key", "✗ not set", tokens.error);

  return h(
    Box,
    { flexDirection: "column", paddingX: 1, paddingY: 1 },
    h(Text, { color: tokens.textMuted }, "SETTINGS"),
    h(Text, { key: "g1" }, " "),
    keyLine,
    row(
      "model",
      `${p.model}${p.modelFromEnv ? "  (ADA_MODEL)" : "  (default)"}`,
      tokens.text,
    ),
    row("key read from", KEY_SOURCES, tokens.textDim),
    row("active pack", p.slug, tokens.text),
    h(Text, { key: "g2" }, " "),
    p.keyAvailable
      ? h(
          Text,
          { color: tokens.textMuted },
          "the key is never shown, never logged — only whether it is set",
        )
      : h(
          Box,
          { flexDirection: "column" },
          h(
            Text,
            { color: tokens.textDim },
            "Set it once — never committed, never logged:",
          ),
          h(
            Text,
            { color: tokens.textMuted },
            "  mkdir -p ~/.ada && printf 'ANTHROPIC_API_KEY=sk-ant-...\\n' >> ~/.ada/.env",
          ),
        ),
    h(Text, { key: "g3" }, " "),
    h(Text, { color: tokens.textMuted }, "esc / b back to the menu"),
  );
}
