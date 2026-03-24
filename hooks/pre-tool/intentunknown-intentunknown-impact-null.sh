#!/bin/bash
# Invariant: intentUnknown.impact !== null
# Entity: IntentUnknown
# Description: Impact classification must exist — unclassified unknowns cannot be prioritized for elicitation turns
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentUnknown.impact !== null
exit 0
