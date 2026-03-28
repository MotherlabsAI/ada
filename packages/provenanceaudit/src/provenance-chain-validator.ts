import {
  ProvenanceChainValidator as EntProvenanceChainValidator,
  ProvenanceRecordWriter,
} from "@ada/ent";
import type {
  ComponentPackageMapping,
  ProvenanceChainHop,
  ProvenanceChainRecord,
  ENTProvenanceRecord,
} from "@ada/ent";

export type { ProvenanceChainRecord, ProvenanceChainHop, ENTProvenanceRecord };

/**
 * ProvenanceChainValidator
 *
 * Validates that every ProvenanceChainRecord contains exactly 3
 * ProvenanceChainHops (C7 invariant). Transitions each chain through
 * states: unvalidated → validating → intact/broken.
 * Produces ENTProvenanceRecord with stage='ENT' for auditing.
 */
export class ProvenanceChainValidator {
  private readonly inner: EntProvenanceChainValidator;
  private readonly writer: ProvenanceRecordWriter;

  constructor(writer?: ProvenanceRecordWriter) {
    this.writer = writer ?? new ProvenanceRecordWriter();
    this.inner = new EntProvenanceChainValidator(this.writer);
  }

  buildChainRecord(
    componentId: string,
    hops: ProvenanceChainHop[],
  ): ProvenanceChainRecord {
    if (hops.length !== 3) {
      throw new Error(
        `Invariant violation: hopCount must be 3, got ${hops.length} for component ${componentId}`,
      );
    }
    return {
      chainId: `chain-${componentId}`,
      pipelineRunId: "ML.ENT.e80e3c97/v1",
      componentId,
      hopCount: 3,
      hops: hops as [
        ProvenanceChainHop,
        ProvenanceChainHop,
        ProvenanceChainHop,
      ],
      provenanceIntact: hops.every((h) => h.isTraced),
      postcode: null,
    };
  }

  validateChain(chain: ProvenanceChainRecord): ProvenanceChainRecord {
    if (chain.hopCount !== 3) {
      throw new Error(
        `Invariant violation: hopCount must be 3, got ${chain.hopCount}`,
      );
    }
    for (const hop of chain.hops) {
      if (!this.validateHop(hop)) {
        return { ...chain, provenanceIntact: false };
      }
    }
    return { ...chain, provenanceIntact: true };
  }

  validateHop(hop: ProvenanceChainHop): boolean {
    return (
      hop.isTraced &&
      hop.fromLabel.length > 0 &&
      hop.toLabel.length > 0 &&
      hop.chainId.length > 0
    );
  }

  writeProvenanceRecord(chain: ProvenanceChainRecord): ENTProvenanceRecord {
    return this.writer.writeRecord(
      "VALIDATE_PROVENANCE_CHAIN",
      chain.componentId,
      "ENT",
      chain.postcode ? [chain.postcode] : [],
    );
  }

  validateAllChains(mapping: ComponentPackageMapping): {
    chains: ProvenanceChainRecord[];
    allIntact: boolean;
  } {
    return this.inner.validateAllChains(mapping);
  }

  getChains(): ProvenanceChainRecord[] {
    return this.inner.getChains();
  }

  getWriter(): ProvenanceRecordWriter {
    return this.writer;
  }
}
