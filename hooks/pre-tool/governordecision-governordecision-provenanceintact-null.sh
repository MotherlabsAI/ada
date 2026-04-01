#!/bin/bash
# Invariant: governorDecision.provenanceIntact !== null
# Entity: GovernorDecision
# Description: provenanceIntact must be explicitly evaluated; null means provenance was never checked
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.provenanceIntact !== null
exit 0
