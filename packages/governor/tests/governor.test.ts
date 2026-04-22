import { describe, it, expect } from "vitest";
import type { Blueprint } from "@ada/compiler";
import {
  ConfidenceTracker,
  evaluateInvariants,
  type DriftResult,
} from "../src/index.js";

// ─── Minimal Blueprint fixture ───────────────────────────────────────────────

function makePostcode(stage: string) {
  return {
    prefix: "ML" as const,
    stage,
    hash: "abc123",
    version: 1,
    raw: `ML.${stage}.abc123.v1`,
  };
}

function makeBlueprint(invariantPredicates: string[]): Blueprint {
  const invariants = invariantPredicates.map((predicate) => ({
    predicate,
    description: `invariant: ${predicate}`,
  }));

  return {
    summary: "test blueprint",
    architecture: {
      pattern: "layered",
      rationale: "test",
      components: [
        {
          name: "TestComponent",
          responsibility: "testing",
          interfaces: [],
          dependencies: [],
          boundedContext: "Test",
        },
      ],
    },
    dataModel: {
      entities: [
        {
          name: "Order",
          category: "substance",
          properties: [
            { name: "id", type: "string", required: true },
            { name: "quantity", type: "number", required: true },
          ],
          invariants,
        },
      ],
      boundedContexts: [
        {
          name: "Test",
          rootEntity: "Order",
          entities: ["Order"],
          invariants: [],
        },
      ],
      challenges: [],
      postcode: makePostcode("ENT"),
    },
    processModel: {
      workflows: [],
      stateMachines: [],
      challenges: [],
      postcode: makePostcode("PRO"),
    },
    nonFunctional: [],
    openQuestions: [],
    resolvedConflicts: [],
    challenges: [],
    postcode: makePostcode("SYN"),
  } as Blueprint;
}

// ─── ConfidenceTracker ───────────────────────────────────────────────────────

describe("ConfidenceTracker", () => {
  it("starts at 1.0 and is not low by default", () => {
    const tracker = new ConfidenceTracker();
    expect(tracker.current).toBe(1.0);
    expect(tracker.isLow).toBe(false);
  });

  it("decays on drift and eventually flags low confidence", () => {
    const tracker = new ConfidenceTracker(0.7);
    // Four drifts: 1.0 → 0.9 → 0.8 → 0.7 → 0.6 (below threshold)
    tracker.onDrift();
    tracker.onDrift();
    tracker.onDrift();
    const after = tracker.onDrift();
    expect(after).toBeCloseTo(0.6, 5);
    expect(tracker.isLow).toBe(true);
  });

  it("clamps confidence within [0, 1] under repeated signals", () => {
    const tracker = new ConfidenceTracker();
    for (let i = 0; i < 50; i++) tracker.onPostconditionFail();
    expect(tracker.current).toBe(0);
    for (let i = 0; i < 50; i++) tracker.onCorrectionApplied();
    expect(tracker.current).toBeLessThanOrEqual(1);
    expect(tracker.current).toBeGreaterThan(0);
  });
});

// ─── evaluateInvariants (drift detection) ────────────────────────────────────

describe("evaluateInvariants", () => {
  it("ACCEPT path: clean output matching invariants produces no drift", () => {
    const blueprint = makeBlueprint([
      "order.id !== null",
      "order.quantity > 0",
    ]);
    const toolOutput = JSON.stringify({ id: "o-1", quantity: 5 });

    const drifts: DriftResult[] = evaluateInvariants(blueprint, toolOutput);

    expect(drifts).toEqual([]);
  });

  it("REJECT path: null field flagged against !== null invariant", () => {
    const blueprint = makeBlueprint(["order.id !== null"]);
    const toolOutput = JSON.stringify({ id: null, quantity: 5 });

    const drifts = evaluateInvariants(blueprint, toolOutput);

    expect(drifts).toHaveLength(1);
    expect(drifts[0]!.hasDrift).toBe(true);
    expect(drifts[0]!.severity).toBe("major");
    expect(drifts[0]!.location).toBe("Order.order.id !== null");
  });

  it("REJECT path: non-positive value flagged against > 0 invariant", () => {
    const blueprint = makeBlueprint(["order.quantity > 0"]);
    const toolOutput = JSON.stringify({ quantity: -3 });

    const drifts = evaluateInvariants(blueprint, toolOutput);

    expect(drifts).toHaveLength(1);
    expect(drifts[0]!.hasDrift).toBe(true);
    expect(drifts[0]!.detail).toContain("order.quantity > 0");
  });

  it("edge case: blueprint with zero entities yields zero drifts", () => {
    const blueprint = makeBlueprint([]);
    // Strip entities entirely
    const empty: Blueprint = {
      ...blueprint,
      dataModel: { ...blueprint.dataModel, entities: [] },
    };
    const drifts = evaluateInvariants(empty, '{"anything": "goes"}');
    expect(drifts).toEqual([]);
  });

  it("edge case: unsupported predicate shape is ignored (no false positive)", () => {
    // The heuristic only knows "!== null" and "> 0" — a regex-less predicate
    // should never produce a drift regardless of output content.
    const blueprint = makeBlueprint(["order.status matches /^(open|closed)$/"]);
    const toolOutput = JSON.stringify({ status: "banana" });

    const drifts = evaluateInvariants(blueprint, toolOutput);

    expect(drifts).toEqual([]);
  });
});
