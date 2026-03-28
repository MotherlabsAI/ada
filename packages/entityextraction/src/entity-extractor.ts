import { EntityRegistrationService, ProvenanceRecordWriter } from "@ada/ent";
import type {
  ComponentPackageMapping,
  ENTEntityRegistration,
  EntityMap,
  NamedBlueprintComponent,
} from "@ada/ent";

export type { ENTEntityRegistration, EntityMap, NamedBlueprintComponent };

/**
 * EntityExtractor
 *
 * Extracts CanonicalEntity instances from NamedBlueprintComponents and
 * assembles them into a populated EntityMap.
 *
 * Enforces:
 *   - entityMap.entityCount === entityMap.entities.length
 *   - entityCount > 0
 */
export class EntityExtractor {
  private readonly service: EntityRegistrationService;
  private readonly writer: ProvenanceRecordWriter;

  constructor(writer?: ProvenanceRecordWriter) {
    this.writer = writer ?? new ProvenanceRecordWriter();
    this.service = new EntityRegistrationService(this.writer);
  }

  extractEntitiesFromComponent(component: NamedBlueprintComponent): {
    entityId: string;
    label: string;
    sourceComponentId: string;
  } {
    return {
      entityId: `entity-${component.componentId}`,
      label: component.name,
      sourceComponentId: component.componentId,
    };
  }

  registerEntity(
    entity: { entityId: string; label: string; sourceComponentId: string },
    sourceComponentId: string,
    provenancePostcode: string,
  ): ENTEntityRegistration {
    return {
      registrationId: `reg-ent-${sourceComponentId}`,
      pipelineRunId: "ML.ENT.e80e3c97/v1",
      sourceComponentId,
      extractedEntityName: entity.label,
      targetRegistryType: "EntityMap",
      entityMapPostcode: provenancePostcode,
      provenanceRecordPostcode: provenancePostcode,
      registeredAt: Date.now(),
    };
  }

  buildEntityMap(
    registrations: ENTEntityRegistration[],
    _entities: { entityId: string; label: string; sourceComponentId: string }[],
  ): EntityMap {
    const count = registrations.length;
    if (count === 0) {
      throw new Error("Invariant violation: entityCount must be > 0");
    }
    if (count !== _entities.length) {
      throw new Error(
        `Invariant violation: entityCount (${count}) !== entities.length (${_entities.length})`,
      );
    }
    const postcode = registrations[0]!.entityMapPostcode;
    return {
      entityMapId: `emap-mapping-ML.ENT.e80e3c97/v1`,
      pipelineRunId: "ML.ENT.e80e3c97/v1",
      entities: registrations,
      entityCount: count,
      postcode,
    };
  }

  extractAndRegisterFromMapping(
    mapping: ComponentPackageMapping,
    pipelineRunId: string,
  ): EntityMap {
    const registrations = this.service.extractEntitiesFromMapping(mapping);
    this.service.registerToEntityMap(registrations, pipelineRunId);
    return this.service.getEntityMap();
  }

  getWriter(): ProvenanceRecordWriter {
    return this.writer;
  }
}
