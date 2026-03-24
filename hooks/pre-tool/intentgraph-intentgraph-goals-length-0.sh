#!/bin/bash
# Invariant: intentGraph.goals.length >= 0
# Entity: IntentGraph
# Description: Goals array must exist — even an empty parse must produce a well-formed structure to propagate downstream
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentGraph.goals.length >= 0
exit 0
