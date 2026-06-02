import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { render } from "ink-testing-library";
import { SlashLine, parseCommand } from "./SlashLine.js";

const tick = () => new Promise((r) => setTimeout(r, 10));

test("parseCommand splits verb and arg", () => {
  assert.deepEqual(parseCommand("/flag"), { cmd: "flag" });
  assert.deepEqual(parseCommand("/deeper ATT.004"), {
    cmd: "deeper",
    arg: "ATT.004",
  });
  assert.deepEqual(parseCommand("flag"), { cmd: "flag" });
  assert.deepEqual(parseCommand("/search live pricing"), {
    cmd: "search",
    arg: "live pricing",
  });
  assert.equal(parseCommand("/bogus"), undefined);
  assert.equal(parseCommand(""), undefined);
});

test("typing /flag then Enter dispatches {cmd:'flag'}", async () => {
  const calls: Array<{ cmd: string; arg?: string }> = [];
  const { stdin } = render(
    h(SlashLine, {
      onCommand: (c: { cmd: string; arg?: string }) => calls.push(c),
    }),
  );
  await tick();
  stdin.write("/flag");
  await tick();
  stdin.write("\r");
  await tick();
  assert.deepEqual(calls, [{ cmd: "flag" }]);
});

test("typing a command with an arg passes the arg", async () => {
  const calls: Array<{ cmd: string; arg?: string }> = [];
  const { stdin } = render(
    h(SlashLine, {
      onCommand: (c: { cmd: string; arg?: string }) => calls.push(c),
    }),
  );
  await tick();
  stdin.write("/deeper ATT.004");
  await tick();
  stdin.write("\r");
  await tick();
  assert.deepEqual(calls, [{ cmd: "deeper", arg: "ATT.004" }]);
});
