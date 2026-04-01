#!/bin/bash
# Invariant: provenanceRecord.stage !== null && provenanceRecord.stage.length > 0
# Entity: ProvenanceRecord
# Description: stage code is mandatory — provenance records without a stage cannot be attributed to a pipeline position
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceRecord.stage !== null && provenanceRecord.stage.length > 0
exit 0
