---
name: formal-verification-and-drift-audit
description: "Use when VerificationContext receives a CodebaseSnapshot — triggered on commit, scheduled interval, or manual request pattern detected."
---

# formal-verification-and-drift-audit

Trigger: VerificationContext receives a CodebaseSnapshot — triggered on commit, scheduled interval, or manual request

## Steps
1. **snapshot-ingestion-and-symbol-extraction**
   - Pre: `CodebaseSnapshot is well-formed, TypeRegistryContext is populated with current TypeRegistryEntry and PackageBoundary records, snapshot has a unique identifier`
   - Action: `VerificationContext extracts CodeSymbols from snapshot by traversing PackageBoundary definitions; indexes symbols against TypeRegistryEntry records; identifies all HoareTriple annotations present in codebase`
   - Post: `CodeSymbol set is populated for this snapshot, HoareTriple index is built, snapshot is marked as 'indexed' in VerificationContext`

2. **diff-against-prior-snapshot**
   - Pre: `Current snapshot is indexed, a prior CodebaseSnapshot exists in VerificationContext for comparison, both snapshots share the same AdaSystem.systemId`
   - Action: `VerificationContext computes DiffResult between current and prior snapshot: identifies added, removed, and modified CodeSymbols and PackageBoundary changes; computes per-boundary change density`
   - Post: `DiffResult is populated with symbol-level changes, PackageBoundary mutation list is produced, change density scores are available for downstream drift assessment`

3. **hoare-triple-consistency-validation**
   - Pre: `HoareTriple index is built from current snapshot, DiffResult is available, BoundedContextResult targets are identified from PackageBoundary list`
   - Action: `For each HoareTriple in the index: evaluate whether the precondition is satisfiable given current EntityMap and type definitions; verify that the postcondition is reachable from the action given current codebase state; record BoundedContextResult per context boundary`
   - Post: `Each HoareTriple has a validation status (valid, weakened, violated, unverifiable); BoundedContextResult records exist per bounded context; VerificationReport is populated with all findings`

4. **semantic-drift-classification-and-report-emission**
   - Pre: `VerificationReport has findings from HoareTriple validation and DiffResult analysis, SemanticDrift records from active CompilationRuns are accessible, BoundedContextResults are populated`
   - Action: `VerificationContext classifies all SemanticDrift records by severity and location, correlates them with HoareTriple violations and DiffResult changes, assembles final VerificationReport with ranked findings and recommended interventions`
   - Post: `VerificationReport is emitted and persisted, each SemanticDrift record has a classification and a linked VerificationFinding, AuditReport is updated with verification run metadata`
