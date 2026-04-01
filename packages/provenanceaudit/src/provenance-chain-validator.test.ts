/**
 * Tests for ProvenanceChainValidator.
 * Run: node --test dist/provenance-chain-validator.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { ProvenanceChainValidator } from "./provenance-chain-validator.js";
import {
  BlueprintRegistryService,
  C3GapResolver,
  ComponentPackageMappingService,
  ProvenanceRecordWriter,
  WORKSPACE_PACKAGE_NODES,
} from "@ada/ent";
import type { ProvenanceChainHop } from "@ada/ent";

function buildTotalMapping() {
  const provenanceWriter = new ProvenanceRecordWriter();
  const svc = new BlueprintRegistryService();
  const resolver = new C3GapResolver(svc);
  const mappingSvc = new ComponentPackageMappingService();

  const components = svc.enumerateComponents();
  let mapping = mappingSvc.buildInitialMapping(
    components,
    WORKSPACE_PACKAGE_NODES,
  );
  const resolvedGap = resolver.resolve();
  mapping = mappingSvc.applyC3Resolution(mapping, resolvedGap);
  mapping = mappingSvc.finalizeMapping(mapping);

  const postcodeMap = new Map<string, string>();
  for (const a of mapping.assignments) {
    if (a.componentOrdinal === 3) {
      postcodeMap.set(a.componentId, resolvedGap.resolutionProvenancePostcode!);
    } else {
      const rec = provenanceWriter.writeRecord(
        "ASSIGNMENT_CONFIRMED",
        a.componentId,
        "ENT",
        [],
      );
      postcodeMap.set(a.componentId, rec.postcode);
    }
  }
  mapping = mappingSvc.stampProvenancePostcodes(mapping, postcodeMap);
  return { mapping, provenanceWriter };
}

test("ProvenanceChainValidator: validateAllChains produces 10 intact chains", () => {
  const { mapping, provenanceWriter } = buildTotalMapping();
  const validator = new ProvenanceChainValidator(provenanceWriter);
  const { chains, allIntact } = validator.validateAllChains(mapping);

  assert.equal(chains.length, 10, "must produce exactly 10 chains");
  assert.equal(allIntact, true, "all chains must be intact");

  for (const chain of chains) {
    assert.equal(chain.hopCount, 3, `chain ${chain.chainId} must have 3 hops`);
    assert.equal(chain.hops.length, 3);
    assert.equal(chain.provenanceIntact, true);
    assert.ok(chain.componentId.length > 0);
  }
});

test("ProvenanceChainValidator: buildChainRecord enforces 3-hop invariant", () => {
  const validator = new ProvenanceChainValidator();

  const hop: ProvenanceChainHop = {
    hopId: "hop-1",
    chainId: "chain-test",
    hopIndex: 0,
    fromLabel: "component",
    toLabel: "package",
    isTraced: true,
    provenanceRecordPostcode: "ML.ENT.abc12345/v1",
  };

  // 3 hops — should succeed
  const chain = validator.buildChainRecord("comp-001", [
    hop,
    { ...hop, hopIndex: 1 },
    { ...hop, hopIndex: 2 },
  ]);
  assert.equal(chain.hopCount, 3);
  assert.equal(chain.provenanceIntact, true);

  // 2 hops — should throw
  assert.throws(
    () =>
      validator.buildChainRecord("comp-002", [hop, { ...hop, hopIndex: 1 }]),
    /hopCount must be 3/,
  );
});

test("ProvenanceChainValidator: validateChain detects broken hops", () => {
  const validator = new ProvenanceChainValidator();

  const goodHop: ProvenanceChainHop = {
    hopId: "hop-good",
    chainId: "chain-test",
    hopIndex: 0,
    fromLabel: "component",
    toLabel: "package",
    isTraced: true,
    provenanceRecordPostcode: "ML.ENT.abc12345/v1",
  };

  const brokenHop: ProvenanceChainHop = {
    ...goodHop,
    hopIndex: 1,
    isTraced: false,
    provenanceRecordPostcode: null,
  };

  const chain = validator.buildChainRecord("comp-broken", [
    goodHop,
    brokenHop,
    { ...goodHop, hopIndex: 2 },
  ]);
  // provenanceIntact should be false since one hop is not traced
  assert.equal(chain.provenanceIntact, false);

  const validated = validator.validateChain(chain);
  assert.equal(validated.provenanceIntact, false);
});

test("ProvenanceChainValidator: validateHop returns true for traced hop with labels", () => {
  const validator = new ProvenanceChainValidator();
  const hop: ProvenanceChainHop = {
    hopId: "hop-1",
    chainId: "chain-1",
    hopIndex: 0,
    fromLabel: "component-A",
    toLabel: "package-B",
    isTraced: true,
    provenanceRecordPostcode: "ML.ENT.abc12345/v1",
  };
  assert.equal(validator.validateHop(hop), true);
});

test("ProvenanceChainValidator: validateHop returns false for untraced hop", () => {
  const validator = new ProvenanceChainValidator();
  const hop: ProvenanceChainHop = {
    hopId: "hop-1",
    chainId: "chain-1",
    hopIndex: 0,
    fromLabel: "component-A",
    toLabel: "package-B",
    isTraced: false,
    provenanceRecordPostcode: null,
  };
  assert.equal(validator.validateHop(hop), false);
});

test("ProvenanceChainValidator: getChains returns chains after validateAllChains", () => {
  const { mapping, provenanceWriter } = buildTotalMapping();
  const validator = new ProvenanceChainValidator(provenanceWriter);
  validator.validateAllChains(mapping);
  const chains = validator.getChains();
  assert.equal(chains.length, 10);
});
