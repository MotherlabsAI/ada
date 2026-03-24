#!/bin/bash
# Invariant: clarificationAnswerRecord.receivedAt !== null
# Entity: ClarificationAnswerRecord
# Description: ClarificationAnswer must have a receipt timestamp — without this, turn duration and session timeline cannot be established
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationAnswerRecord.receivedAt !== null
exit 0
