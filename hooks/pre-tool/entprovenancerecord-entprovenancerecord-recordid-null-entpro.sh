#!/bin/bash
# Invariant: entProvenanceRecord.recordId !== null && entProvenanceRecord.recordId.length > 0
# Entity: ENTProvenanceRecord
# Description: recordId must be non-null — it is the stable database key for this record
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entProvenanceRecord.recordId !== null && entProvenanceRecord.recordId.length > 0
exit 0
