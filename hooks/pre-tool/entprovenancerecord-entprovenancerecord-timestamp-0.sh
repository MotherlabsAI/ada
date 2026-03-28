#!/bin/bash
# Invariant: entProvenanceRecord.timestamp > 0
# Entity: ENTProvenanceRecord
# Description: the record must have a valid timestamp; zero or negative timestamps indicate an uninitialized record that should not participate in chain validation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entProvenanceRecord.timestamp > 0
exit 0
