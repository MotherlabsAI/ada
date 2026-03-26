---
name: semantic-drift-verification
description: "Use when file watcher detects codebase change OR CI step invokes verification OR user runs verify command pattern detected."
---

# semantic-drift-verification

Trigger: file watcher detects codebase change OR CI step invokes verification OR user runs verify command

## Steps
1. **snapshot-codebase**
   - Pre: `target codebase path is accessible AND a live Blueprint with GOV postcode exists in context graph`
   - Action: `walk file tree, extract CodeSymbols (functions, classes, modules) with their signatures and source locations, compute CodebaseSnapshot with content hash, store snapshot with timestamp`
   - Post: `CodebaseSnapshot persisted with hash and timestamp, CodeSymbol list non-empty, snapshot linked to triggering event (file change path or CI run id)`

2. **bind-symbols-to-blueprint**
   - Pre: `CodebaseSnapshot exists with non-empty CodeSymbol list AND live Blueprint exists with GOV postcode`
   - Action: `for each CodeSymbol, resolve binding to BlueprintComponent or Entity or WorkflowStep by name matching and semantic similarity, record CodeSymbol→blueprint-node bindings in ProvenanceTrace, flag unbound symbols as candidates for SemanticDrift`
   - Post: `every CodeSymbol has either a confirmed binding to a Blueprint node or an explicit unbound marker, ProvenanceTrace entries created linking code location to Blueprint postcode nodes, binding coverage ratio computed`

3. **evaluate-semantic-drift**
   - Pre: `ProvenanceTrace entries from bind-symbols-to-blueprint step exist AND previous VerificationReport exists for baseline comparison OR first-run flag is set`
   - Action: `compare current binding map against baseline: identify new unbound symbols, identify symbols whose bound Blueprint node has changed postcode version, identify Blueprint nodes no longer referenced by any CodeSymbol; compute drift score; generate SemanticDrift records per changed binding`
   - Post: `SemanticDrift records created for each drift instance with delta description, drift score attached to VerificationReport, VerificationReport transitions to evaluated state`

4. **publish-verification-report**
   - Pre: `VerificationReport is in evaluated state AND SemanticDrift records are attached`
   - Action: `stamp PostcodeAddress VER-{hash}-v1 on VerificationReport, register ProvenanceRecord upstream=[GOV postcode, snapshot hash], write report to context graph, update stale Blueprint nodes in context graph based on drift findings, optionally trigger partial recompilation of drifted stages`
   - Post: `VerificationReport in published state with postcode, context graph reflects updated staleness markers on affected nodes, any AI coding agent querying MCP server receives drift-aware context, partial recompilation queued if drift scope matches a recompilable stage boundary`
