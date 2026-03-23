#!/bin/bash
# Invariant: provenanceRecord.sourceFragment !== null
# Entity: ProvenanceRecord
# Description: provenance must reference the specific semantic fragment
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceRecord.sourceFragment !== null
exit 0
