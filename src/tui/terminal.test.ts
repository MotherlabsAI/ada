import { test } from "node:test";
import assert from "node:assert/strict";
import { restoreTerminal } from "./terminal.js";

function fakeOut(isTTY: boolean) {
  const writes: string[] = [];
  return { isTTY, write: (s: string) => writes.push(s), writes };
}
function fakeIn(isTTY: boolean) {
  const calls: boolean[] = [];
  return { isTTY, setRawMode: (m: boolean) => calls.push(m), calls };
}

test("restoreTerminal on a TTY leaves the alt screen, shows the cursor, and disables raw mode (TERM.001)", () => {
  const out = fakeOut(true);
  const inp = fakeIn(true);
  restoreTerminal(out, inp);
  const written = out.writes.join("");
  assert.match(written, /\x1b\[\?1049l/, "leaves the alternate screen");
  assert.match(written, /\x1b\[\?25h/, "shows the cursor");
  assert.deepEqual(inp.calls, [false], "raw mode disabled exactly once");
});

test("restoreTerminal on a non-TTY writes NOTHING (no escape bytes into a pipe)", () => {
  const out = fakeOut(false);
  const inp = fakeIn(false);
  restoreTerminal(out, inp);
  assert.equal(
    out.writes.length,
    0,
    "no escape sequences into a redirected stdout",
  );
  assert.equal(inp.calls.length, 0, "no setRawMode on a non-TTY stdin");
});

test("restoreTerminal tolerates a stdin whose setRawMode throws (already torn down)", () => {
  const out = fakeOut(true);
  const inp = {
    isTTY: true,
    setRawMode: () => {
      throw new Error("stream closed");
    },
  };
  assert.doesNotThrow(
    () => restoreTerminal(out, inp),
    "a torn-down stream is not fatal",
  );
  assert.match(out.writes.join(""), /\x1b\[\?25h/, "the cursor is still shown");
});
