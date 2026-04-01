#!/bin/bash
# Invariant: intentGraph.goals.length >= 1
# Entity: IntentGraph
# Description: an IntentGraph with no goals has no semantic content — the pipeline cannot proceed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentGraph.goals.length >= 1
exit 0
