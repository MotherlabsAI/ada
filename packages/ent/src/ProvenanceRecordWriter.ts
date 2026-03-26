import { createHash } from "crypto";
import { ENTProvenanceRecord } from "./types.js";

const PIPELINE_RUN_ID = "ML.ENT.e80e3c97/v1";

function generateRecordId(): string {
  return `rec-${Math.random().toString(36).slice(2, 10)}`;
}

function makePostcode(
  actionType: string,
  subjectId: string,
  ts: number,
): string {
  const hash = createHash("sha256")
    .update(`ENT:${actionType}:${subjectId}:${ts}`)
    .digest("hex")
    .slice(0, 8);
  return `ML.ENT.${hash}/v1`;
}

// In-memory append-only audit store.
// Invariant: records are never mutated or deleted once written.
export class ProvenanceRecordWriter {
  private readonly records: Map<string, ENTProvenanceRecord> = new Map();

  // Write a single ENTProvenanceRecord. Idempotent on postcode collision when
  // content is identical; throws on content mismatch.
  writeRecord(
    actionType: string,
    subjectId: string,
    stage: "ENT",
    upstreamPostcodes: string[],
  ): ENTProvenanceRecord {
    if (!actionType) throw new Error("actionType must be non-empty");
    if (!subjectId) throw new Error("subjectId must be non-empty");

    const timestamp = Date.now();
    const postcode = makePostcode(actionType, subjectId, timestamp);
    const content = JSON.stringify({
      actionType,
      subjectId,
      upstreamPostcodes,
    });

    // Idempotency check
    const existing = this.records.get(postcode);
    if (existing) {
      if (existing.content === content) return existing; // identical — idempotent
      // Content mismatch — generate new postcode with collision annotation
      const collisionPostcode = makePostcode(
        actionType,
        `${subjectId}:COLLISION_RESOLVED`,
        timestamp + 1,
      );
      const resolved: ENTProvenanceRecord = {
        recordId: generateRecordId(),
        postcode: collisionPostcode,
        stage,
        actionType,
        subjectId,
        pipelineRunId: PIPELINE_RUN_ID,
        upstreamPostcodes,
        content: `${content}:COLLISION_RESOLVED`,
        timestamp: timestamp + 1,
      };
      this.records.set(collisionPostcode, resolved);
      return resolved;
    }

    const record: ENTProvenanceRecord = {
      recordId: generateRecordId(),
      postcode,
      stage,
      actionType,
      subjectId,
      pipelineRunId: PIPELINE_RUN_ID,
      upstreamPostcodes,
      content,
      timestamp,
    };
    this.records.set(postcode, record);
    return record;
  }

  // Write a batch of records, linking each to the postcode of the previous.
  writeAuditBatch(
    actions: Array<{
      actionType: string;
      subjectId: string;
      upstreamPostcodes: string[];
    }>,
  ): ENTProvenanceRecord[] {
    return actions.map((a) =>
      this.writeRecord(a.actionType, a.subjectId, "ENT", a.upstreamPostcodes),
    );
  }

  getPostcode(record: ENTProvenanceRecord): string {
    return record.postcode;
  }

  getRecord(postcode: string): ENTProvenanceRecord | undefined {
    return this.records.get(postcode);
  }

  getAllRecords(): ENTProvenanceRecord[] {
    return [...this.records.values()];
  }

  // Validates the DAG: no postcode appears in its own upstream chain.
  validateNoUpstreamCycles(): boolean {
    for (const record of this.records.values()) {
      if (this.hasCycle(record.postcode, new Set())) return false;
    }
    return true;
  }

  private hasCycle(postcode: string, visited: Set<string>): boolean {
    if (visited.has(postcode)) return true;
    const record = this.records.get(postcode);
    if (!record) return false;
    visited.add(postcode);
    for (const upstream of record.upstreamPostcodes) {
      if (this.hasCycle(upstream, new Set(visited))) return true;
    }
    return false;
  }
}
