#!/bin/bash
# Invariant: provenanceRecord.stage !== null && provenanceRecord.stage.length > 0
# Entity: ProvenanceRecord
# Description: Stage must be declared — a record with no stage cannot be placed in the transformation history
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceRecord.stage !== null && provenanceRecord.stage.length > 0
exit 0
