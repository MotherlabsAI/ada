/**
 * Tests for BlueprintRegistryLoader.
 * Run: node --test dist/blueprint-registry-loader.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { BlueprintRegistryLoader } from "./blueprint-registry-loader.js";

const PIPELINE_RUN_ID = "ML.ENT.e80e3c97/v1";

test("BlueprintRegistryLoader: loadRegistry returns 10 components", () => {
  const loader = new BlueprintRegistryLoader();
  const registry = loader.loadRegistry(PIPELINE_RUN_ID);

  assert.equal(registry.totalComponentCount, 10);
  assert.equal(registry.components.length, 10);
  assert.equal(registry.pipelineRunId, PIPELINE_RUN_ID);
  assert.ok(registry.registryId.length > 0);
  assert.ok(registry.postcode.length > 0);
});

test("BlueprintRegistryLoader: all ordinals 1-10 present and unique", () => {
  const loader = new BlueprintRegistryLoader();
  const registry = loader.loadRegistry(PIPELINE_RUN_ID);
  const ordinals = registry.components
    .map((c) => c.ordinal)
    .sort((a, b) => a - b);
  assert.deepEqual(ordinals, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test("BlueprintRegistryLoader: each component has required fields", () => {
  const loader = new BlueprintRegistryLoader();
  const registry = loader.loadRegistry(PIPELINE_RUN_ID);

  for (const c of registry.components) {
    assert.ok(
      c.componentId.length > 0,
      `ordinal ${c.ordinal}: componentId missing`,
    );
    assert.ok(c.name.length > 0, `ordinal ${c.ordinal}: name missing`);
    assert.ok(
      c.registryId.length > 0,
      `ordinal ${c.ordinal}: registryId missing`,
    );
    assert.ok(
      c.responsibility.length > 0,
      `ordinal ${c.ordinal}: responsibility missing`,
    );
    assert.ok(
      c.boundedContext.length > 0,
      `ordinal ${c.ordinal}: boundedContext missing`,
    );
  }
});

test("BlueprintRegistryLoader: ordinal-3 component has null assignedPackage", () => {
  const loader = new BlueprintRegistryLoader();
  const registry = loader.loadRegistry(PIPELINE_RUN_ID);
  const c3 = registry.components.find((c) => c.ordinal === 3);
  assert.ok(c3, "ordinal-3 component must exist");
  assert.equal(
    c3!.assignedPackage,
    null,
    "C3 must have null assignedPackage initially",
  );
});

test("BlueprintRegistryLoader: getComponentByOrdinal returns correct component", () => {
  const loader = new BlueprintRegistryLoader();
  const registry = loader.loadRegistry(PIPELINE_RUN_ID);

  for (let ord = 1; ord <= 10; ord++) {
    const component = loader.getComponentByOrdinal(registry, ord);
    assert.equal(component.ordinal, ord);
    assert.ok(component.componentId.length > 0);
  }
});

test("BlueprintRegistryLoader: validateRegistryInvariants returns true for valid registry", () => {
  const loader = new BlueprintRegistryLoader();
  const registry = loader.loadRegistry(PIPELINE_RUN_ID);
  const result = loader.validateRegistryInvariants(registry);
  assert.equal(result, true);
});

test("BlueprintRegistryLoader: loadRegistry throws on wrong pipelineRunId", () => {
  const loader = new BlueprintRegistryLoader();
  assert.throws(
    () => loader.loadRegistry("ML.ENT.wrong/v1"),
    /pipelineRunId mismatch/,
  );
});
