#!/bin/bash
# Invariant: clarificationRequest.question !== null && clarificationRequest.question.trim().length > 0
# Entity: ClarificationRequest
# Description: question text must be non-empty before surfacing to user
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationRequest.question !== null && clarificationRequest.question.trim().length > 0
exit 0
