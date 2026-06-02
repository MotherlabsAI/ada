/**
 * SlashLine — the command input. Mirrors the readline `ada ⌘` prompt as an Ink
 * controlled input: `useInput` accumulates characters, Enter parses the line into
 * a {cmd, arg} for the known verbs and fires `onCommand`, then clears the buffer.
 */
import { createElement as h, useState } from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "./theme.js";

export type Verb =
  | "deeper"
  | "branch"
  | "flag"
  | "reject"
  | "wiki"
  | "export"
  | "search"
  | "quit";

const VERBS = new Set<Verb>([
  "deeper",
  "branch",
  "flag",
  "reject",
  "wiki",
  "export",
  "search",
  "quit",
]);

export interface Command {
  cmd: Verb;
  arg?: string;
}

export interface SlashLineProps {
  onCommand: (command: Command) => void;
  /** When false, the line ignores input (App may own a different mode). */
  active?: boolean;
}

/** Parse a raw line ("/flag", "/deeper ATT.004", "flag") into a Command. */
export function parseCommand(raw: string): Command | undefined {
  const line = raw.trim().replace(/^\//, "").trim();
  if (!line) return undefined;
  const space = line.indexOf(" ");
  const verb = (space === -1 ? line : line.slice(0, space)).toLowerCase();
  if (!VERBS.has(verb as Verb)) return undefined;
  const arg = space === -1 ? "" : line.slice(space + 1).trim();
  return arg ? { cmd: verb as Verb, arg } : { cmd: verb as Verb };
}

export function SlashLine(props: SlashLineProps) {
  const [buffer, setBuffer] = useState("");
  const active = props.active ?? true;

  useInput(
    (input, key) => {
      if (key.return) {
        const parsed = parseCommand(buffer);
        if (parsed) props.onCommand(parsed);
        setBuffer("");
        return;
      }
      if (key.backspace || key.delete) {
        setBuffer((b) => b.slice(0, -1));
        return;
      }
      // Ignore control keys / escape sequences; append printable input only.
      if (input && !key.ctrl && !key.meta && !key.escape) {
        setBuffer((b) => b + input);
      }
    },
    { isActive: active },
  );

  return h(
    Box,
    null,
    h(Text, { color: theme.cyan }, "⌘ "),
    h(Text, null, buffer),
    h(Text, { color: theme.ink }, "▏"),
  );
}
