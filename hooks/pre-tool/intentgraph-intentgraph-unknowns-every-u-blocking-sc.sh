#!/bin/bash
# Invariant: intentGraph.unknowns.every(u => ["blocking","scoping","implementation"].includes(u.impact))
# Entity: IntentGraph
# Description: Every unknown must have a valid impact classification — without this, the Governor cannot assess risk
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentGraph.unknowns.every(u => ["blocking","scoping","implementation"].includes(u.impact))
exit 0
