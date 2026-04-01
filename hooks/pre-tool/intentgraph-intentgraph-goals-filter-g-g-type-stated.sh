#!/bin/bash
# Invariant: intentGraph.goals.filter(g => g.type === 'stated').length >= 1
# Entity: IntentGraph
# Description: at least one goal must be explicitly stated — derived/implied goals alone are insufficient to anchor compilation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentGraph.goals.filter(g => g.type === 'stated').length >= 1
exit 0
