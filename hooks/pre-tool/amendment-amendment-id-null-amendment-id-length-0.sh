#!/bin/bash
# Invariant: amendment.id !== null && amendment.id.length > 0
# Entity: Amendment
# Description: amendments must be uniquely identifiable — anonymous amendments cannot be queued or reviewed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: amendment.id !== null && amendment.id.length > 0
exit 0
