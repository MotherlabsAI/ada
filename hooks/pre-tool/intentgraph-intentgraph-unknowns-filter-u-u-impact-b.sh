#!/bin/bash
# Invariant: intentGraph.unknowns.filter(u => u.impact === 'blocking').length === 0 || clarificationsResolved === true
# Entity: IntentGraph
# Description: blocking unknowns must be resolved before pipeline execution
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentGraph.unknowns.filter(u => u.impact === 'blocking').length === 0 || clarificationsResolved === true
exit 0
