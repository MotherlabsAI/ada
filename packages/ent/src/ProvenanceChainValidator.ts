import { createHash } from "crypto";
import {
  ComponentPackageMapping,
  ProvenanceChainHop,
  ProvenanceChainRecord,
} from "./types.js";
import type { ProvenanceRecordWriter } from "./ProvenanceRecordWriter.js";

// Three-hop chain per component:
//   hop-0 (index 0): componentId → assignedPackage
//   hop-1 (index 1): assignedPackage → pipelineStage
//   hop-2 (index 2): pipelineStage → pipelineRunId

const PIPELINE_RUN_ID = "ML.ENT.e80e3c97/v1";
const PIPELINE_STAGE = "ENT";

function makeChainId(componentId: string): string {
  return `chain-${componentId}-${PIPELINE_RUN_ID}`;
}

function makeHopId(chainId: string, hopIndex: number): string {
  return `hop-${chainId}-${hopIndex}`;
}

function makeChainPostcode(chainId: string): string {
  const hash = createHash("sha256")
    .update(`chain:${chainId}`)
    .digest("hex")
    .slice(0, 8);
  return `ML.ENT.${hash}/v1`;
}

export class ProvenanceChainValidator {
  private chains: ProvenanceChainRecord[] = [];

  constructor(private readonly provenanceWriter: ProvenanceRecordWriter) {}

  // Validate the three-hop chain for one component.
  validateChain(
    componentId: string,
    packageName: string,
    stage: string,
    pipelineRunId: string,
  ): ProvenanceChainRecord {
    if (pipelineRunId !== PIPELINE_RUN_ID) {
      throw new Error(
        `pipelineRunId mismatch: expected '${PIPELINE_RUN_ID}', got '${pipelineRunId}'`,
      );
    }

    const chainId = makeChainId(componentId);

    // hop-0: component → package
    const hop0 = this.traceHop({
      hopId: makeHopId(chainId, 0),
      chainId,
      hopIndex: 0,
      fromLabel: componentId,
      toLabel: packageName,
      isTraced: false,
      provenanceRecordPostcode: null,
    });

    // hop-1: package → stage
    const hop1 = this.traceHop({
      hopId: makeHopId(chainId, 1),
      chainId,
      hopIndex: 1,
      fromLabel: packageName,
      toLabel: stage,
      isTraced: false,
      provenanceRecordPostcode: null,
    });

    // hop-2: stage → pipelineRunId
    const hop2 = this.traceHop({
      hopId: makeHopId(chainId, 2),
      chainId,
      hopIndex: 2,
      fromLabel: stage,
      toLabel: pipelineRunId,
      isTraced: false,
      provenanceRecordPostcode: null,
    });

    const provenanceIntact = hop0.isTraced && hop1.isTraced && hop2.isTraced;

    const chainPostcode = provenanceIntact ? makeChainPostcode(chainId) : null;

    const chain: ProvenanceChainRecord = {
      chainId,
      pipelineRunId,
      componentId,
      hopCount: 3,
      hops: [hop0, hop1, hop2],
      provenanceIntact,
      postcode: chainPostcode,
    };

    this.chains.push(chain);
    return chain;
  }

  traceHop(hop: ProvenanceChainHop): ProvenanceChainHop {
    if (!hop.fromLabel) throw new Error("hop.fromLabel must be non-empty");
    if (!hop.toLabel) throw new Error("hop.toLabel must be non-empty");
    if (!hop.chainId) throw new Error("hop.chainId must be non-empty");

    // Write a provenance record for this hop trace action
    const provRecord = this.provenanceWriter.writeRecord(
      `HOP_TRACE_${hop.hopIndex}`,
      `${hop.fromLabel}:${hop.toLabel}`,
      "ENT",
      [],
    );

    return {
      ...hop,
      isTraced: true,
      provenanceRecordPostcode: provRecord.postcode,
    };
  }

  isChainIntact(chain: ProvenanceChainRecord): boolean {
    return (
      chain.hopCount === 3 &&
      chain.hops.length === 3 &&
      chain.hops.every((h) => h.isTraced === true) &&
      chain.provenanceIntact === true &&
      chain.postcode !== null
    );
  }

  // Validate chains for all 10 components in the mapping.
  // Returns true if ALL chains are intact (provenanceIntact for the ENT gate).
  validateAllChains(mapping: ComponentPackageMapping): {
    chains: ProvenanceChainRecord[];
    allIntact: boolean;
  } {
    this.chains = [];

    for (const assignment of mapping.assignments) {
      this.validateChain(
        assignment.componentId,
        assignment.targetPackage,
        PIPELINE_STAGE,
        PIPELINE_RUN_ID,
      );
    }

    const allIntact = this.chains.every((c) => c.provenanceIntact);
    return { chains: this.chains, allIntact };
  }

  getChains(): ProvenanceChainRecord[] {
    return [...this.chains];
  }
}
