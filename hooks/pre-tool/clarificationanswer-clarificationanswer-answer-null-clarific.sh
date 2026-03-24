#!/bin/bash
# Invariant: clarificationAnswer.answer !== null && clarificationAnswer.answer.length > 0
# Entity: ClarificationAnswer
# Description: Answer must be non-empty — an empty answer does not resolve the unknown
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationAnswer.answer !== null && clarificationAnswer.answer.length > 0
exit 0
