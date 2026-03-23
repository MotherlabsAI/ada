#!/bin/bash
# Invariant: provenanceRecord.recordId !== null
# Entity: ProvenanceRecord
# Description: provenance record must have a unique id
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceRecord.recordId !== null
exit 0
