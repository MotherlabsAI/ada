#!/bin/bash
# Invariant: gate.passed === (gate.entityCount >= 1 && gate.provenanceIntact && gate.allBlockersCleared && gate.mappingIsTotal)
# Entity: ENTGateRecord
# Description: the passed flag must be the logical conjunction of all gate conditions — a discrepancy is a false gate result
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gate.passed === (gate.entityCount >= 1 && gate.provenanceIntact && gate.allBlockersCleared && gate.mappingIsTotal)
exit 0
