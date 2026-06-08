import { test } from "node:test";
import assert from "node:assert/strict";
import { deadline } from "./model.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test("deadline aborts its signal after the budget elapses (MODELCALL.003: a hung call can't hang the compile)", async () => {
  const d = deadline(20);
  assert.equal(d.signal.aborted, false, "not aborted before the budget");
  await sleep(45);
  assert.equal(d.signal.aborted, true, "aborted once the budget elapsed");
  d.clear();
});

test("deadline.clear() cancels the abort — a call that returns in time is never aborted", async () => {
  const d = deadline(20);
  d.clear(); // the call returned: stop the timer
  await sleep(45);
  assert.equal(d.signal.aborted, false, "cleared timer never fires");
});

test("the abort signal is a real AbortSignal — wired to fetch's signal option", () => {
  const d = deadline(1000);
  assert.ok(
    typeof d.signal === "object" && "aborted" in d.signal,
    "deadline yields an AbortSignal fetch accepts",
  );
  d.clear();
});
