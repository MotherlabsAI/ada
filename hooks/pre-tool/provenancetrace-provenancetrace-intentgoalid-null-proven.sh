#!/bin/bash
# Invariant: provenanceTrace.intentGoalId !== null || provenanceTrace.blueprintEntity !== null || provenanceTrace.blueprintComponent !== null
# Entity: ProvenanceTrace
# Description: Provenance trace must reference at least one anchor — a trace with all null references links nothing
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceTrace.intentGoalId !== null || provenanceTrace.blueprintEntity !== null || provenanceTrace.blueprintComponent !== null
exit 0
