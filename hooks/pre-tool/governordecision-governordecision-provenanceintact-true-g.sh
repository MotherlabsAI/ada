#!/bin/bash
# Invariant: governorDecision.provenanceIntact === true || governorDecision.decision === "reject"
# Entity: GovernorDecision
# Description: If provenance is not intact the Governor must reject — accepting an artifact with broken lineage violates the core architectural invariant
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.provenanceIntact === true || governorDecision.decision === "reject"
exit 0
