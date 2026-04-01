#!/bin/bash
# Invariant: entProvenanceRecord.timestamp > 0
# Entity: ENTProvenanceRecord
# Description: timestamp must be positive — provenance records are ordered by timestamp
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entProvenanceRecord.timestamp > 0
exit 0
