#!/bin/bash
# Invariant: intentGraph.postcode !== null
# Entity: IntentGraph
# Description: every IntentGraph must be content-addressed to anchor the provenance chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentGraph.postcode !== null
exit 0
