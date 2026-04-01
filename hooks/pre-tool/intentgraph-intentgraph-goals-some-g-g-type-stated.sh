#!/bin/bash
# Invariant: intentGraph.goals.some(g => g.type === 'stated')
# Entity: IntentGraph
# Description: at least one goal must be explicitly stated by the user — derived/implied goals alone do not constitute valid input
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentGraph.goals.some(g => g.type === 'stated')
exit 0
