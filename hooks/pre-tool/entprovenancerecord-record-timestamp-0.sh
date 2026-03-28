#!/bin/bash
# Invariant: record.timestamp > 0
# Entity: ENTProvenanceRecord
# Description: a zero or negative timestamp indicates an uninitialized record that was never committed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: record.timestamp > 0
exit 0
