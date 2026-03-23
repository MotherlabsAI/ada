#!/bin/bash
# Invariant: provenanceRecord.producingStage !== null
# Entity: ProvenanceRecord
# Description: the compiler stage that produced the element must be recorded
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceRecord.producingStage !== null
exit 0
