/**
 * Tests for EntityExtractor.
 * Run: node --test dist/entity-extractor.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { EntityExtractor } from "./entity-extractor.js";
import {
  BlueprintRegistryService,
  C3GapResolver,
  ComponentPackageMappingService,
  ProvenanceRecordWriter,
  WORKSPACE_PACKAGE_NODES,
} from "@ada/ent";

const PIPELINE_RUN_ID = "ML.ENT.e80e3c97/v1";

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

test("EntityExtractor: extractAndRegisterFromMapping produces EntityMap with entityCount >= 10", () => {
  const { mapping } = buildTotalMapping();
  const extractor = new EntityExtractor();
  const entityMap = extractor.extractAndRegisterFromMapping(
    mapping,
    PIPELINE_RUN_ID,
  );

  assert.ok(
    entityMap.entityCount >= 10,
    `entityCount must be >= 10, got ${entityMap.entityCount}`,
  );
  assert.equal(entityMap.entities.length, entityMap.entityCount);
  assert.equal(entityMap.pipelineRunId, PIPELINE_RUN_ID);
  assert.ok(entityMap.postcode.length > 0, "entityMap must have postcode");
  assert.ok(
    entityMap.entityMapId.length > 0,
    "entityMap must have entityMapId",
  );
});

test("EntityExtractor: extractEntitiesFromComponent returns entity info", () => {
  const extractor = new EntityExtractor();
  const svc = new BlueprintRegistryService();
  const component = svc.getComponentByOrdinal(1);

  const entity = extractor.extractEntitiesFromComponent(component);

  assert.ok(entity.entityId.length > 0, "entityId must be non-empty");
  assert.ok(entity.label.length > 0, "label must be non-empty");
  assert.equal(entity.sourceComponentId, component.componentId);
});

test("EntityExtractor: registerEntity produces valid ENTEntityRegistration", () => {
  const extractor = new EntityExtractor();
  const svc = new BlueprintRegistryService();
  const component = svc.getComponentByOrdinal(1);
  const entity = extractor.extractEntitiesFromComponent(component);

  const registration = extractor.registerEntity(
    entity,
    component.componentId,
    "ML.ENT.abc12345/v1",
  );

  assert.equal(registration.targetRegistryType, "EntityMap");
  assert.equal(registration.sourceComponentId, component.componentId);
  assert.ok(registration.registrationId.length > 0);
  assert.ok(registration.registeredAt > 0);
  assert.equal(registration.pipelineRunId, PIPELINE_RUN_ID);
});

test("EntityExtractor: buildEntityMap enforces entityCount invariant", () => {
  const { mapping } = buildTotalMapping();
  const extractor = new EntityExtractor();

  // Should throw with empty registrations
  assert.throws(
    () => extractor.buildEntityMap([], []),
    /entityCount must be > 0/,
  );

  // Should throw when counts mismatch
  const svc = new BlueprintRegistryService();
  const component = svc.getComponentByOrdinal(1);
  const entity = extractor.extractEntitiesFromComponent(component);
  const registration = extractor.registerEntity(
    entity,
    component.componentId,
    "ML.ENT.abc12345/v1",
  );

  assert.throws(
    () => extractor.buildEntityMap([registration], [entity, entity]),
    /entityCount.*entities\.length/,
  );

  void mapping;
});

test("EntityExtractor: full pipeline produces EntityMap with all registrations having provenance", () => {
  const { mapping } = buildTotalMapping();
  const extractor = new EntityExtractor();
  const entityMap = extractor.extractAndRegisterFromMapping(
    mapping,
    PIPELINE_RUN_ID,
  );

  for (const reg of entityMap.entities) {
    assert.equal(reg.targetRegistryType, "EntityMap");
    assert.ok(
      reg.provenanceRecordPostcode.length > 0,
      "registration must have provenance postcode",
    );
    assert.ok(
      reg.entityMapPostcode.length > 0,
      "registration must reference EntityMap",
    );
    assert.ok(
      reg.sourceComponentId.length > 0,
      "registration must trace to source component",
    );
    assert.ok(reg.registeredAt > 0, "registeredAt must be positive");
  }
});
