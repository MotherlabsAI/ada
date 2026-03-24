#!/bin/bash
# Invariant: intentGraph.goals.length > 0 || intentGraph.unknowns.length > 0
# Entity: IntentGraph
# Description: A graph with no goals and no unknowns has not been elicited — it cannot enter the compiler pipeline
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentGraph.goals.length > 0 || intentGraph.unknowns.length > 0
exit 0
