---
name: full-pipeline-compilation-run
description: "Use when CompilationRun initiated with raw intent payload pattern detected."
---

# full-pipeline-compilation-run

Trigger: CompilationRun initiated with raw intent payload

## Steps
1. **INT-parse-intent**
   - Pre: `rawIntent is non-empty string; CompilationRun exists in state 'uninitialized'; no active run for same session`
   - Action: `parse rawIntent into IntentGraph with goals, constraints, unknowns; assign PostcodeAddress(prefix='INT', stage='intake', hash=contentHash, version); emit StageCompleteEvent(INT)`
   - Post: `IntentGraph exists with valid postcode; all goals have id+type; unknowns have impact scores; ProvenanceRecord(stage=INT) created and stored`

2. **INT-resolve-clarifications**
   - Pre: `IntentGraph is in state 'clarification_pending'; ClarificationAnswer received within session TTL`
   - Action: `merge ClarificationAnswer into IntentGraph unknowns; re-evaluate impact scores; re-stamp PostcodeAddress with updated hash`
   - Post: `IntentGraph transitions to 'clarified'; no unknowns with impact=BLOCKING remain; ProvenanceRecord updated with upstream clarification postcode`

3. **PER-build-domain-context**
   - Pre: `IntentGraph is in state 'clarified' or 'locked'; INT ProvenanceRecord exists and is validated`
   - Action: `extract domain from IntentGraph goals; identify stakeholders with role/knowledgeBase/blindSpots; build ubiquitousLanguage from goal vocabulary; assign PostcodeAddress(prefix='PER', stage='perception'); chain provenance upstream to INT postcode`
   - Post: `DomainContext exists with non-empty domain string; at least one Stakeholder identified; ProvenanceRecord(stage=PER, upstreamPostcodes=[INT.postcode]) stored`

4. **ENT-extract-entity-map**
   - Pre: `DomainContext is valid with postcode; PER ProvenanceRecord exists; ubiquitousLanguage is non-empty or THIN_DOMAIN flag accepted`
   - Action: `extract entities from DomainContext + IntentGraph; classify each entity by category; derive properties with types; establish invariants; assign bounded contexts; assign PostcodeAddress(prefix='ENT'); chain provenance upstream to PER postcode`
   - Post: `EntityMap exists with at least one entity; all entities have at least one invariant; no two entities in same bounded context share identical name; ProvenanceRecord(stage=ENT) stored with upstream chain`

5. **PRO-build-process-flow**
   - Pre: `EntityMap exists with valid postcode; ENT ProvenanceRecord exists; at least one entity has defined invariants`
   - Action: `derive ProcessFlow from EntityMap transitions and IntentGraph goals; sequence process steps respecting invariants; detect cycles in process graph; assign PostcodeAddress(prefix='PRO'); chain provenance upstream to ENT postcode`
   - Post: `ProcessFlow is a directed acyclic graph; all process steps reference existing entities; ProvenanceRecord(stage=PRO) stored; no circular dependencies present`

6. **SYN-synthesize-blueprint**
   - Pre: `ProcessFlow is non-cyclic DAG with valid postcode; EntityMap postcode valid; PRO and ENT ProvenanceRecords exist and chain correctly; no CYCLIC_UNRESOLVED flag on ProcessFlow`
   - Action: `synthesize Blueprint from ProcessFlow + EntityMap; resolve conflicts via ResolvedConflict records; collapse AmbiguitySet items; assign architectural components; pass through SYNGate validation; assign PostcodeAddress(prefix='SYN'); chain provenance upstream to PRO+ENT postcodes`
   - Post: `Blueprint exists with BlueprintArchitecture and at least one BlueprintComponent; SYNValidationResult is PASS; all AmbiguitySet items resolved or explicitly deferred; ProvenanceRecord(stage=SYN) stored with dual upstream chain`

7. **AUD-audit-blueprint**
   - Pre: `Blueprint exists with valid SYN postcode; full provenance chain INT→PER→ENT→PRO→SYN is unbroken and all hashes validate; SYNValidationResult is PASS`
   - Action: `traverse full provenance chain; detect SemanticDrift between each stage boundary; verify entity invariants are preserved end-to-end; generate VerificationFindings per bounded context; produce AuditReport; assign PostcodeAddress(prefix='AUD'); chain provenance upstream to SYN postcode`
   - Post: `AuditReport exists with drift analysis for all 5 upstream stage transitions; VerificationReport contains BoundedContextResult for each bounded context; ProvenanceRecord(stage=AUD) stored; no CRITICAL SemanticDrift items without documented mitigation`

8. **GOV-issue-decision**
   - Pre: `AuditReport exists with valid AUD postcode; full provenance chain is intact through AUD; Governor has not already issued a decision for this CompilationRun iteration`
   - Action: `evaluate AuditReport against governance policies; assess PolicyViolations; evaluate UncertaintyMarkers; issue GovernorDecision as one of: ACCEPT, REJECT, FALLBACK; if ACCEPT, produce CompileResult; if FALLBACK, produce FallbackBlueprintResult; record IterationRecord; assign PostcodeAddress(prefix='GOV'); chain provenance upstream to AUD postcode`
   - Post: `GovernorDecision is recorded and immutable; if ACCEPT, CompileResult exists with full provenance chain; if REJECT, IterationRecord exists with rejection rationale and re-entry stage; if FALLBACK, FallbackBlueprintResult exists with scope reduction documented; ProvenanceRecord(stage=GOV) stored`
