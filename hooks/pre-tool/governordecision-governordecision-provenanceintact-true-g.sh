#!/bin/bash
# Invariant: governorDecision.provenanceIntact === true || governorDecision.decision !== 'ACCEPT'
# Entity: GovernorDecision
# Description: GOV cannot emit ACCEPT if provenance is broken — a broken chain means the blueprint cannot be trusted
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.provenanceIntact === true || governorDecision.decision !== 'ACCEPT'
exit 0
