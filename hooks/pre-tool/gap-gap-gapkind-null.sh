#!/bin/bash
# Invariant: gap.gapKind !== null
# Entity: Gap
# Description: Gap must declare its kind — without this, the appropriate elicitation strategy cannot be selected
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.gapKind !== null
exit 0
