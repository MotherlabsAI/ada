#!/bin/bash
# Invariant: intentGraph.rawIntent !== null && intentGraph.rawIntent.length > 0
# Entity: IntentGraph
# Description: the raw intent string is the authoritative source trace — it must be preserved verbatim
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentGraph.rawIntent !== null && intentGraph.rawIntent.length > 0
exit 0
