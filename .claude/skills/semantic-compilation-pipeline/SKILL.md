---
ada_postcode: "ML.SKL.semantic-compilation-pipeline/v1"
ada_type: skill
ada_name: semantic-compilation-pipeline
ada_compiled_at: 1776806934913
---
---
name: semantic-compilation-pipeline
description: "Use when operator submits natural language intent string to Ada compilation endpoint, or system detects absent CompiledInvariantSet for session pattern detected."
---

# semantic-compilation-pipeline

Trigger: operator submits natural language intent string to Ada compilation endpoint, or system detects absent CompiledInvariantSet for session

## Steps
1. **intent-ingestion-and-tokenization**
   - Pre: `raw intent string is non-empty, session exists in opening or active state, no concurrent compilation is running for this sessionId`
   - Action: `tokenize and segment natural language intent into semantic units; assign compilationRunId; emit InterStageIR_v1 with rawTokens, sessionId, compilationRunId, timestamp`
   - Post: `InterStageIR_v1 record exists with contentHash, sessionId bound, rawTokens non-empty, compilationRunId unique`

2. **ontology-resolution**
   - Pre: `InterStageIR_v1 exists and contentHash validates; OntologyBaseLayer is loaded and version-pinned for this compilationRunId`
   - Action: `map each semantic unit to OntologyNode references; resolve synonyms, ambiguities via OntologyKnowledge context; emit InterStageIR_v2 with resolvedNodes, unresolvedTerms, ontologyVersion`
   - Post: `InterStageIR_v2 exists; unresolvedTerms count is below permissible threshold (<=10% of tokens); ontologyVersion recorded in provenance`

3. **invariant-extraction**
   - Pre: `InterStageIR_v2 exists and validates; unresolved term ratio below threshold; compilationRunId active`
   - Action: `extract candidate CompiledInvariants from resolved ontology nodes; assign hardPredicate, semanticAnchor, proximityThreshold, severity, sourceStage=3 to each; emit InterStageIR_v3 with candidateInvariants list`
   - Post: `InterStageIR_v3 exists with at least 1 candidate invariant; each invariant has non-null hardPredicate and severity; contentHash recorded`

4. **world-model-compilation**
   - Pre: `InterStageIR_v3 exists with non-empty candidateInvariants; RuntimeWorldModel for sessionId exists in seeding or live state`
   - Action: `derive expectedState from candidateInvariants and resolved ontology; compute CompiledWorldModel with expectedState snapshot; assign version, contentHash, producedAt, artifactSetId; emit InterStageIR_v4 with compiledWorldModelId`
   - Post: `CompiledWorldModel record persisted with valid contentHash; expectedState is structurally complete; CompiledWorldModel.version increments monotonically from prior version`

5. **governance-artifact-generation**
   - Pre: `InterStageIR_v4 exists; CompiledWorldModel persisted; artifactSetId assigned`
   - Action: `generate CLAUDE.md, agent definitions, pre-tool hooks, MCP server configuration from compiledWorldModelId and candidateInvariants; bundle into ArtifactSet keyed by artifactSetId; emit InterStageIR_v5 with artifactSetId and artifact content hashes`
   - Post: `ArtifactSet contains all 4 artifact types; each artifact has a stable ArtifactReference with contentHash; InterStageIR_v5 contentHash covers all artifact hashes`

6. **artifact-coherence-verification**
   - Pre: `ArtifactSet is complete with all 4 artifact types; all contentHashes recorded in InterStageIR_v5; compilationRunId still active`
   - Action: `run ArtifactCoherenceVerifier across all artifacts in ArtifactSet; check cross-artifact semantic consistency, referential integrity of ArtifactReferences, and invariant coverage completeness; emit CoherenceVerificationResult with pass/fail and error localizations`
   - Post: `CoherenceVerificationResult.status = PASS; all inter-artifact references resolve; invariant coverage is complete (every CompiledInvariant referenced by at least one artifact)`

7. **compiled-invariant-set-finalization**
   - Pre: `CoherenceVerificationResult.status = PASS; all artifact contentHashes validated; compilationRunId active`
   - Action: `promote candidateInvariants to CompiledInvariantSet with final id, sessionId, version, contentHash, compiledAt, bootstrapFlag=false, authoredBy=compilationRunId; persist CompiledInvariantSet; emit InterStageIR_v6 with compiledInvariantSetId; prior CompiledInvariantSet transitions to superseded`
   - Post: `CompiledInvariantSet persisted and version-incremented; prior version marked superseded; SessionId bound to new compiledInvariantSetId; AuditLogEntry written for finalization event`

8. **runtime-activation**
   - Pre: `CompiledInvariantSet is finalized and persisted; ArtifactSet is coherent and active; GovernorState for sessionId exists`
   - Action: `activate CompiledInvariantSet in SemanticGateEnforcer for sessionId; load ArtifactSet into runtime enforcement context; set GovernorState.currentPollingIntervalMs to basePollingIntervalMs; emit compilation-complete event to observability`
   - Post: `SemanticGateEnforcer is armed with current compiledInvariantSetId; GovernorState is active; session transitions from bootstrapping or compiling to active; ObservabilitySnapshot records activation`

9. **projection-engine-initialization**
   - Pre: `session is in active state; CompiledWorldModel is loaded; CompiledInvariantSet is armed in gate`
   - Action: `initialize projection engine with CompiledWorldModel.expectedState as baseline; compute initial ProjectionTrigger thresholds from DriftThreshold for sessionId; register projection engine with governor polling loop`
   - Post: `projection engine is registered and baseline is set; DriftThreshold persisted for sessionId; governor polling loop includes projection engine callback`
