import { test } from "node:test";
import assert from "node:assert/strict";
import { canRunInk } from "./canRunInk.js";

const rawTty = { isTTY: true, setRawMode: () => {} };

test("true only when both streams are TTYs and stdin supports raw mode", () => {
  assert.equal(canRunInk(rawTty, { isTTY: true }), true);
});

test("false when stdin is not a TTY (the non-TTY fallback case)", () => {
  assert.equal(canRunInk({ isTTY: false }, { isTTY: true }), false);
  assert.equal(canRunInk({}, { isTTY: true }), false);
});

test("false when stdout is not a TTY", () => {
  assert.equal(canRunInk(rawTty, { isTTY: false }), false);
});

test("false when stdin is a TTY but cannot set raw mode (the flash-and-die case)", () => {
  assert.equal(canRunInk({ isTTY: true }, { isTTY: true }), false);
  assert.equal(
    canRunInk({ isTTY: true, setRawMode: undefined }, { isTTY: true }),
    false,
  );
});
