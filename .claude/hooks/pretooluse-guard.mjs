#!/usr/bin/env node
/**
 * PreToolUse guard — bound B1/B2 of bounded self-application (governance/invariants.md).
 *
 * The AXIOMS are the FROZEN QUOTIENT: the part of the system the self-application loop
 * may not rewrite. This guard blocks a live, in-place edit of that core (and of any
 * artifact explicitly marked immutable), forcing change to flow the lawful way — an
 * explicit, human-ratified AXIOMS delta, or a re-compile (A1) — never a silent agent edit.
 *
 * Contract: Claude Code pipes the tool call as JSON on stdin. Exit 0 = allow; exit 2 =
 * block (stderr is shown to the model/user). FAIL OPEN: any parse/IO error → exit 0, so a
 * buggy rail can never brick the workflow. This is a tripwire, not a security boundary.
 *
 * Deliberate override (the human delta): set ADA_AXIOM_DELTA=1 in the environment.
 */
import { basename } from "node:path";
import { readFileSync } from "node:fs";

const ALLOW = 0;
const BLOCK = 2;

function read(fd) {
  try {
    return readFileSync(fd, "utf8");
  } catch {
    return "";
  }
}

try {
  if (process.env.ADA_AXIOM_DELTA === "1") process.exit(ALLOW); // deliberate, human-set

  const raw = read(0);
  if (!raw.trim()) process.exit(ALLOW);
  const ev = JSON.parse(raw);

  const tool = ev.tool_name ?? ev.toolName ?? "";
  const EDITORS = ["Edit", "Write", "MultiEdit", "NotebookEdit"];
  if (!EDITORS.includes(tool)) process.exit(ALLOW);

  const input = ev.tool_input ?? ev.toolInput ?? {};
  const path = input.file_path ?? input.path ?? input.notebook_path ?? "";
  if (!path) process.exit(ALLOW);

  const base = basename(path);

  // The frozen quotient: AXIOMS.md by name, plus anything marked immutable on disk.
  const FROZEN_NAMES = new Set(["AXIOMS.md"]);
  let frozen = FROZEN_NAMES.has(base);
  if (!frozen) {
    const head = read(path).slice(0, 4000);
    frozen =
      /STATUS:\s*immutable/i.test(head) || /<!--\s*ADA:FROZEN/i.test(head);
  }
  if (!frozen) process.exit(ALLOW);

  process.stderr.write(
    `BLOCKED (bounded self-application · B1/B2): "${base}" is the frozen quotient.\n` +
      `The AXIOMS are immutable under self-application — the recursion converges only\n` +
      `because this core does not move. To change it lawfully:\n` +
      `  • propose an explicit AXIOMS delta and get Alex's ratification (A4), or\n` +
      `  • move the deterministic layer by RE-COMPILE, not a live edit (A1).\n` +
      `Deliberate override: set ADA_AXIOM_DELTA=1.\n`,
  );
  process.exit(BLOCK);
} catch {
  process.exit(ALLOW); // fail open
}
