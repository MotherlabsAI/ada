import { test } from "node:test";
import assert from "node:assert/strict";
import { mcpExports, mcpResources, mcpTools } from "./mcp.js";
import type { PackModel } from "../core/types.js";

const model = (): PackModel =>
  ({ slug: "demo", graph: { nodes: [], edges: [] } }) as unknown as PackModel;

test("mcpResources expose the governed family by URI (any MCP client can mount the context)", () => {
  const rs = mcpResources(model());
  const uris = rs.map((r) => r.uri);
  assert.ok(
    uris.every((u) => u.startsWith("ada://demo/")),
    "stable per-pack URIs",
  );
  for (const k of ["pom", "graph", "autonomy"]) {
    assert.ok(
      uris.some((u) => u.endsWith("/" + k)),
      `the ${k} resource is exposed`,
    );
  }
  assert.ok(
    rs.every((r) => r.name && r.description && r.mimeType),
    "every resource is well-formed (name + description + mimeType)",
  );
});

test("mcpTools expose the bounded read-only verify capability with an input schema", () => {
  const ts = mcpTools(model());
  const check = ts.find((t) => /check/i.test(t.name));
  assert.ok(check, "a run-checks tool is exposed");
  assert.equal(
    check!.inputSchema.type,
    "object",
    "tools carry a JSON-Schema input contract",
  );
});

test("mcpExports emits valid, deterministic JSON config (resources.json + tools.json)", () => {
  const a = mcpExports(model());
  const b = mcpExports(model());
  assert.deepEqual(
    a.map((f) => f.path).sort(),
    ["resources.json", "tools.json"],
    "both MCP config files are emitted",
  );
  for (const f of a)
    assert.doesNotThrow(() => JSON.parse(f.content), `${f.path} is valid JSON`);
  assert.equal(
    JSON.stringify(a),
    JSON.stringify(b),
    "byte-stable across runs (deterministic — no Date/Map)",
  );
});
