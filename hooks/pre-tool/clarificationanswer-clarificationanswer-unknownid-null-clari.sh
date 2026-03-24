#!/bin/bash
# Invariant: clarificationAnswer.unknownId !== null && clarificationAnswer.unknownId.length > 0
# Entity: ClarificationAnswer
# Description: Unknown ID must be non-empty — without it the answer cannot be matched to its ClarificationRequest
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationAnswer.unknownId !== null && clarificationAnswer.unknownId.length > 0
exit 0
