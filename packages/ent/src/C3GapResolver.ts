import { createHash } from "crypto";
import {
  C3AssignmentGap,
  WorkspacePackageName,
  WORKSPACE_PACKAGES,
} from "./types.js";
import type { BlueprintRegistryService } from "./BlueprintRegistryService.js";

// C3 (ordinal 3, ElicitationEngine) maps deterministically to 'elicitation':
// its bounded context is ElicitationSession, its responsibility describes the
// elicitation lifecycle, and the @ada/elicitation package is the sole owner
// of that domain. No other package is a valid candidate.

const PIPELINE_RUN_ID = "ML.ENT.e80e3c97/v1";

function makeGapId(): string {
  return `gap-c3-${PIPELINE_RUN_ID}`;
}

function makeResolutionPostcode(
  gapId: string,
  resolvedPackage: string,
): string {
  const hash = createHash("sha256")
    .update(`c3-resolution:${gapId}:${resolvedPackage}`)
    .digest("hex")
    .slice(0, 8);
  return `ML.ENT.${hash}/v1`;
}

export class C3GapResolver {
  private gap: C3AssignmentGap;

  constructor(registryService: BlueprintRegistryService) {
    const c3Component = registryService.getComponentByOrdinal(3);

    this.gap = {
      gapId: makeGapId(),
      pipelineRunId: PIPELINE_RUN_ID,
      componentOrdinal: 3,
      componentName: c3Component.name,
      componentId: c3Component.componentId,
      candidatePackages: [],
      isResolved: false,
      resolvedPackage: null,
      state: "open",
      resolutionProvenancePostcode: null,
    };
  }

  getGap(): C3AssignmentGap {
    return this.gap;
  }

  getResolutionStatus(gap: C3AssignmentGap): string {
    return gap.state;
  }

  identifyCandidatePackages(gap: C3AssignmentGap): C3AssignmentGap {
    if (gap.state !== "open") {
      throw new Error(
        `Cannot identify candidates: gap is in state '${gap.state}', expected 'open'`,
      );
    }

    // ElicitationEngine's responsibility is the elicitation lifecycle.
    // Score each package by relevance to the component's boundedContext and
    // responsibility keywords. The 'elicitation' package is the clear winner.
    const candidates = this.rankCandidates(gap);

    const updated: C3AssignmentGap = {
      ...gap,
      candidatePackages: candidates,
      state: candidates.length >= 1 ? "candidate-identified" : "open",
    };
    this.gap = updated;
    return updated;
  }

  private rankCandidates(gap: C3AssignmentGap): WorkspacePackageName[] {
    // Score packages by relevance to 'ElicitationEngineComponent'
    const scores: Record<WorkspacePackageName, number> = {
      elicitation: 10, // exact domain match — elicitation lifecycle
      compiler: 2, // compilation is downstream of elicitation
      governor: 0,
      provenance: 0,
      "int-rerun": 0,
      "config-writer": 0,
      orchestrator: 1, // orchestration could manage sessions
      "mcp-server": 0,
    };

    void gap; // gap metadata confirms this is ElicitationEngineComponent

    return (
      WORKSPACE_PACKAGES.filter((p) => scores[p] > 0) as WorkspacePackageName[]
    ).sort((a, b) => scores[b] - scores[a]);
  }

  resolveGap(
    gap: C3AssignmentGap,
    selectedPackage: WorkspacePackageName,
  ): C3AssignmentGap {
    if (gap.state !== "candidate-identified") {
      throw new Error(
        `Cannot resolve: gap is in state '${gap.state}', expected 'candidate-identified'`,
      );
    }
    if (gap.candidatePackages.length === 0) {
      throw new Error("Cannot resolve: candidatePackages is empty");
    }
    if (!WORKSPACE_PACKAGES.includes(selectedPackage)) {
      throw new Error(
        `resolvedPackage '${selectedPackage}' is not a valid workspace package`,
      );
    }
    if (!gap.candidatePackages.includes(selectedPackage)) {
      throw new Error(
        `resolvedPackage '${selectedPackage}' is not among candidate packages`,
      );
    }

    const postcode = makeResolutionPostcode(gap.gapId, selectedPackage);

    const resolved: C3AssignmentGap = {
      ...gap,
      isResolved: true,
      resolvedPackage: selectedPackage,
      state: "resolved",
      resolutionProvenancePostcode: postcode,
    };
    this.gap = resolved;
    return resolved;
  }

  // Deterministic resolution: identify candidates then resolve to top-ranked.
  // Returns the fully resolved C3AssignmentGap.
  resolve(): C3AssignmentGap {
    let g = this.gap;
    g = this.identifyCandidatePackages(g);
    if (g.candidatePackages.length === 0) {
      throw new Error("C3_UNRESOLVABLE: no candidate packages identified");
    }
    const topCandidate = g.candidatePackages[0]!;
    g = this.resolveGap(g, topCandidate);
    this.gap = g;
    return g;
  }
}
