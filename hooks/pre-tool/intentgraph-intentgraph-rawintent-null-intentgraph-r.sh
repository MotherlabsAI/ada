#!/bin/bash
# Invariant: intentGraph.rawIntent !== null && intentGraph.rawIntent.trim().length > 0
# Entity: IntentGraph
# Description: raw intent must be non-empty — no empty-string compilations
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentGraph.rawIntent !== null && intentGraph.rawIntent.trim().length > 0
exit 0
