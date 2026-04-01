#!/bin/bash
# Invariant: entGateRecord.passed === (entGateRecord.provenanceIntact && entGateRecord.allBlockersCleared)
# Entity: ENTGateRecord
# Description: the ENT gate passes if and only if provenance is intact AND all blockers are cleared — partial satisfaction is a gate failure
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entGateRecord.passed === (entGateRecord.provenanceIntact && entGateRecord.allBlockersCleared)
exit 0
