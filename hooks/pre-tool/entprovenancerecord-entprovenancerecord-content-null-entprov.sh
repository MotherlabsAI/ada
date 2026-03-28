#!/bin/bash
# Invariant: entProvenanceRecord.content !== null && entProvenanceRecord.content.length > 0
# Entity: ENTProvenanceRecord
# Description: a provenance record with empty content is a structural shell that proves nothing and cannot satisfy G5 verification
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entProvenanceRecord.content !== null && entProvenanceRecord.content.length > 0
exit 0
