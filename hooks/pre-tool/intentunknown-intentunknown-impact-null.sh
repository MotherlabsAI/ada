#!/bin/bash
# Invariant: intentUnknown.impact !== null
# Entity: IntentUnknown
# Description: impact classification must be present to determine pipeline gate behaviour
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentUnknown.impact !== null
exit 0
