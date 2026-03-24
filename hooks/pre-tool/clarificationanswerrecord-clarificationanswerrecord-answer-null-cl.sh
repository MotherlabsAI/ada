#!/bin/bash
# Invariant: clarificationAnswerRecord.answer !== null && clarificationAnswerRecord.answer.length > 0
# Entity: ClarificationAnswerRecord
# Description: Answer must be non-empty — a blank answer resolves nothing
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationAnswerRecord.answer !== null && clarificationAnswerRecord.answer.length > 0
exit 0
