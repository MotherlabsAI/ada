#!/bin/bash
# Invariant: governorDecision.decision === 'ACCEPT' ? governorDecision.provenanceIntact === true : true
# Entity: GovernorDecision
# Description: ACCEPT is only valid when the full provenance chain is intact
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.decision === 'ACCEPT' ? governorDecision.provenanceIntact === true : true
exit 0
