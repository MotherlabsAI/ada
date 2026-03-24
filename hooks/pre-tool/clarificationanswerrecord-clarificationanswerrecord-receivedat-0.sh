#!/bin/bash
# Invariant: clarificationAnswerRecord.receivedAt > 0
# Entity: ClarificationAnswerRecord
# Description: Receipt timestamp must be positive — unordered answers corrupt session timeline
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationAnswerRecord.receivedAt > 0
exit 0
