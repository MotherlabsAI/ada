import { test } from "node:test";
import assert from "node:assert/strict";
import { extractJson, parseJsonLoose } from "./json.js";

test("extracts a bare JSON object", () => {
  assert.equal(extractJson('{"a":1}'), '{"a":1}');
});

test("ignores a TRAILING sentence after the JSON (the real bug)", () => {
  const raw =
    '{"id":"ATT.001","label":"x"}\n\nLet me know if you want another node.';
  assert.deepEqual(parseJsonLoose(raw), { id: "ATT.001", label: "x" });
});

test("ignores LEADING prose before the JSON", () => {
  const raw = 'Here is the node you asked for:\n{"id":"X","n":2}';
  assert.deepEqual(parseJsonLoose(raw), { id: "X", n: 2 });
});

test("peels ```json fences", () => {
  const raw = '```json\n{"k":"v"}\n```';
  assert.deepEqual(parseJsonLoose(raw), { k: "v" });
});

test("handles braces INSIDE string values (string-aware scan)", () => {
  const raw = '{"summary":"use a { and } literally","ok":true} trailing';
  assert.deepEqual(parseJsonLoose(raw), {
    summary: "use a { and } literally",
    ok: true,
  });
});

test("handles escaped quotes inside strings", () => {
  const raw = '{"q":"she said \\"hi\\" and { left"} then prose';
  assert.deepEqual(parseJsonLoose(raw), { q: 'she said "hi" and { left' });
});

test("extracts a top-level array (cluster proposal shape)", () => {
  const raw = '[{"code":"ARCH"},{"code":"FLOW"}] and that is the list.';
  assert.deepEqual(parseJsonLoose(raw), [{ code: "ARCH" }, { code: "FLOW" }]);
});

test("returns null when there is no JSON value", () => {
  assert.equal(extractJson("no json here at all"), null);
  assert.equal(parseJsonLoose("no json here at all"), null);
});

test("returns null on an unbalanced / truncated object", () => {
  assert.equal(extractJson('{"a":1, "b":'), null);
  assert.equal(parseJsonLoose('{"a":1, "b":'), null);
});
