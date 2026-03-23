#!/bin/bash
# Invariant: clarificationAnswer.markerRef !== null
# Entity: ClarificationAnswer
# Description: answer must reference its ambiguity marker
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationAnswer.markerRef !== null
exit 0
