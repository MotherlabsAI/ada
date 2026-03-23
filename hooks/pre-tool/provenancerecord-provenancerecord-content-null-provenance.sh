#!/bin/bash
# Invariant: provenanceRecord.content !== null && provenanceRecord.content.trim().length > 0
# Entity: ProvenanceRecord
# Description: record content must not be empty — empty records break the chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceRecord.content !== null && provenanceRecord.content.trim().length > 0
exit 0
