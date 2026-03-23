#!/bin/bash
# Invariant: provenanceRecord.timestamp > 0
# Entity: ProvenanceRecord
# Description: timestamp must be a positive epoch value
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceRecord.timestamp > 0
exit 0
