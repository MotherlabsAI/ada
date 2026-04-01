#!/bin/bash
# Invariant: macroPlan.capturedAt > 0
# Entity: MacroPlan
# Description: plan must record when it was captured — undated plans cannot be correlated with session state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: macroPlan.capturedAt > 0
exit 0
