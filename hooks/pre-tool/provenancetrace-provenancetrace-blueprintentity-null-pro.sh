#!/bin/bash
# Invariant: !(provenanceTrace.blueprintEntity !== null && provenanceTrace.intentGoalId === null && provenanceTrace.intentPhrase === null)
# Entity: ProvenanceTrace
# Description: A blueprint entity trace must connect to intent — entities with no intent anchor have no provenance basis
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: !(provenanceTrace.blueprintEntity !== null && provenanceTrace.intentGoalId === null && provenanceTrace.intentPhrase === null)
exit 0
