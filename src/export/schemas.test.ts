import { test } from "node:test";
import assert from "node:assert/strict";
import { projectSchemas } from "./schemas.js";
import { NODE_TYPES, EDGE_TYPES } from "../core/types.js";
import type { PackModel } from "../core/types.js";

const model = (): PackModel => ({ slug: "demo" }) as unknown as PackModel;

test("projectSchemas emits machine JSON Schemas for the asset envelope, the node, and the edge", () => {
  const files = projectSchemas(model());
  assert.deepEqual(files.map((f) => f.path).sort(), [
    "schemas/asset.schema.json",
    "schemas/edge.schema.json",
    "schemas/node.schema.json",
  ]);
  for (const f of files) {
    const s = JSON.parse(f.content);
    assert.equal(
      s.$schema,
      "https://json-schema.org/draft/2020-12/schema",
      "valid JSON Schema dialect",
    );
    assert.equal(s.type, "object");
    assert.ok(
      Array.isArray(s.required) && s.required.length,
      "declares required fields",
    );
  }
});

test("the asset schema encodes the §2 envelope: status lifecycle + the decomposition content buckets", () => {
  const asset = JSON.parse(
    projectSchemas(model()).find((f) => f.path === "schemas/asset.schema.json")!
      .content,
  );
  const status = asset.properties.lifecycle.properties.status.enum;
  for (const s of [
    "hole",
    "draft",
    "verified",
    "frozen",
    "stale",
    "superseded",
  ]) {
    assert.ok(status.includes(s), `status enum includes ${s}`);
  }
  for (const bucket of [
    "facts",
    "claims",
    "assumptions",
    "unknowns",
    "decisions",
    "actions",
  ]) {
    assert.ok(
      asset.properties.contents.properties[bucket],
      `contents.${bucket} is in the envelope`,
    );
  }
});

test("the node/edge schemas are sourced from the REAL enums (cannot drift from types.ts)", () => {
  const node = JSON.parse(
    projectSchemas(model()).find((f) => f.path === "schemas/node.schema.json")!
      .content,
  );
  const edge = JSON.parse(
    projectSchemas(model()).find((f) => f.path === "schemas/edge.schema.json")!
      .content,
  );
  assert.deepEqual(
    node.properties.semanticType.enum,
    [...NODE_TYPES],
    "node enum == NODE_TYPES",
  );
  assert.deepEqual(node.properties.truth.enum, [
    "source",
    "inference",
    "residue",
  ]);
  assert.deepEqual(
    edge.properties.type.enum,
    [...EDGE_TYPES],
    "edge enum == EDGE_TYPES",
  );
});

test("projectSchemas is deterministic (byte-stable, no Date/Map)", () => {
  assert.equal(
    JSON.stringify(projectSchemas(model())),
    JSON.stringify(projectSchemas(model())),
  );
});
