#!/bin/bash
# Invariant: intentUnknown.id !== null && intentUnknown.id.length > 0
# Entity: IntentUnknown
# Description: unknown must have a stable id for clarification linkage
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentUnknown.id !== null && intentUnknown.id.length > 0
exit 0
