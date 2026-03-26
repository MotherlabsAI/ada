import { createHash } from "crypto";
import {
  ComponentPackageMapping,
  ENTEntityRegistration,
  EntityMap,
} from "./types.js";
import type { ProvenanceRecordWriter } from "./ProvenanceRecordWriter.js";

const PIPELINE_RUN_ID = "ML.ENT.e80e3c97/v1";

function makeRegistrationId(componentId: string): string {
  return `reg-ent-${componentId}`;
}

function makeEntityMapPostcode(mappingId: string): string {
  const hash = createHash("sha256")
    .update(`entity-map:${mappingId}:${PIPELINE_RUN_ID}`)
    .digest("hex")
    .slice(0, 8);
  return `ML.ENT.${hash}/v1`;
}

function makeEntityMapId(mappingId: string): string {
  return `emap-${mappingId}`;
}

export class EntityRegistrationService {
  private registrations: ENTEntityRegistration[] = [];
  private entityMap: EntityMap | null = null;

  constructor(private readonly provenanceWriter: ProvenanceRecordWriter) {}

  // Step 1 of workflow-2: extract one ENTEntityRegistration per assignment.
  extractEntitiesFromMapping(
    mapping: ComponentPackageMapping,
  ): ENTEntityRegistration[] {
    if (!mapping.isTotal) {
      throw new Error(
        "Cannot extract entities: ComponentPackageMapping.isTotal is false",
      );
    }
    if (mapping.assignments.some((a) => !a.isResolved)) {
      throw new Error(
        "Cannot extract entities: one or more assignments are unresolved",
      );
    }

    const entityMapPostcode = makeEntityMapPostcode(mapping.mappingId);
    const registeredAt = Date.now();

    const registrations: ENTEntityRegistration[] = mapping.assignments.map(
      (assignment) => {
        // Write a provenance record for this registration action
        const provRecord = this.provenanceWriter.writeRecord(
          "ENTITY_REGISTRATION",
          assignment.componentId,
          "ENT",
          [mapping.postcode ?? ""],
        );

        return {
          registrationId: makeRegistrationId(assignment.componentId),
          pipelineRunId: PIPELINE_RUN_ID,
          sourceComponentId: assignment.componentId,
          extractedEntityName: assignment.componentName,
          targetRegistryType: "EntityMap",
          entityMapPostcode,
          provenanceRecordPostcode: provRecord.postcode,
          registeredAt,
        };
      },
    );

    this.registrations = registrations;
    return registrations;
  }

  // Builds the EntityMap from the registration list. Returns entity count.
  registerToEntityMap(
    registrations: ENTEntityRegistration[],
    pipelineRunId: string,
  ): number {
    if (pipelineRunId !== PIPELINE_RUN_ID) {
      throw new Error(
        `pipelineRunId mismatch: expected '${PIPELINE_RUN_ID}', got '${pipelineRunId}'`,
      );
    }
    if (registrations.length === 0) {
      throw new Error(
        "Cannot register: registrations array is empty — entityCount must be > 0",
      );
    }

    const entityMapId = makeEntityMapId(`mapping-${PIPELINE_RUN_ID}`);
    const entityMapPostcode = registrations[0]!.entityMapPostcode;

    // Write a provenance record for the EntityMap seal event
    const sealRecord = this.provenanceWriter.writeRecord(
      "ENTITY_MAP_SEALED",
      entityMapId,
      "ENT",
      registrations.map((r) => r.provenanceRecordPostcode),
    );

    this.entityMap = {
      entityMapId,
      pipelineRunId,
      entities: registrations,
      entityCount: registrations.length,
      postcode: sealRecord.postcode || entityMapPostcode,
    };

    return registrations.length;
  }

  getRegistrationCount(): number {
    return this.registrations.length;
  }

  getEntityMap(): EntityMap {
    if (!this.entityMap) {
      throw new Error(
        "EntityMap not yet built — call registerToEntityMap first",
      );
    }
    return this.entityMap;
  }

  getRegistrations(): ENTEntityRegistration[] {
    return [...this.registrations];
  }
}
