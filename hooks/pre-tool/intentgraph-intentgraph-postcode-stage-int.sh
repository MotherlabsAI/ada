#!/bin/bash
# Invariant: intentGraph.postcode.stage === 'INT'
# Entity: IntentGraph
# Description: postcode stage must match INT stage
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentGraph.postcode.stage === 'INT'
exit 0
