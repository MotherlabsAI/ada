import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { Governor } from "./governor.js";
import { createGovernedCanUseTool } from "./interceptor.js";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { ManifoldStore, SemanticNode } from "@ada/provenance";

describe("Governor & Interceptor Integration", () => {
  const testDir = path.join(process.cwd(), ".ada-test-gov");

  before(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    execSync("git init", { cwd: testDir });
    execSync('git config user.email "test@example.com"', { cwd: testDir });
    execSync('git config user.name "Test User"', { cwd: testDir });
    execSync("git commit --allow-empty -m 'initial commit'", { cwd: testDir });
  });

  after(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("blocks tool calls that violate manifold invariants", async () => {
    const store = new ManifoldStore(testDir);
    const governor = new Governor(testDir);

    const contextNode: SemanticNode = {
      id: "ML.L2I.ENT.LOC.WHT.SFT.abcdef12/v1",
      coordinate: {
        layer: "L2I",
        concern: "ENT",
        scope: "LOC",
        dimension: "WHT",
        domain: "SFT",
      },
      content: {
        name: "Payments",
        invariants: [{ predicate: "amount > 0" }],
      },
      provenance: [],
      entropy: 0.1,
    };

    store.saveManifold({
      ref: "",
      nodes: { [contextNode.id]: contextNode },
      edges: [],
      metrics: { totalEntropy: 0.1, nodeCount: 1, invariantPassRate: 1.0 },
    });

    const tool = { name: "write_file" };
    const input = { file_path: "src/Payments/transaction.json", amount: -100 };

    let originalCalled = false;
    const originalCanUseTool = async () => {
      originalCalled = true;
      return { behavior: "allow" as const };
    };

    const governedCanUseTool = createGovernedCanUseTool(
      governor,
      originalCanUseTool,
    );
    const result = await governedCanUseTool(tool, input, {}, {}, "tool-123");

    assert.equal(result.behavior, "deny");
    assert.ok(result.message.includes("Manifold Invariant Violation"));
    assert.equal(result.decisionReason.reason, "amount > 0");
    assert.equal(originalCalled, false);
  });

  it("permits tool calls that satisfy manifold invariants", async () => {
    const governor = new Governor(testDir);
    const tool = { name: "write_file" };
    const input = { file_path: "src/Payments/transaction.json", amount: 100 };

    let originalCalled = false;
    const originalCanUseTool = async () => {
      originalCalled = true;
      return { behavior: "allow" as const };
    };

    const governedCanUseTool = createGovernedCanUseTool(
      governor,
      originalCanUseTool,
    );
    const result = await governedCanUseTool(tool, input, {}, {}, "tool-456");

    assert.equal(result.behavior, "allow");
    assert.equal(originalCalled, true);
  });
});
