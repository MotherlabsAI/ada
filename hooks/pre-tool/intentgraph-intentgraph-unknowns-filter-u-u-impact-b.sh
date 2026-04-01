#!/bin/bash
# Invariant: intentGraph.unknowns.filter(u => u.impact === 'blocking').length === 0 || /* elicitation incomplete */false
# Entity: IntentGraph
# Description: all blocking unknowns must be resolved before the pipeline advances past INT — unresolved blockers invalidate the graph
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentGraph.unknowns.filter(u => u.impact === 'blocking').length === 0 || /* elicitation incomplete */false
exit 0
