#!/bin/bash
# Invariant: clarificationAnswerRecord.clarificationAnswerId !== null && clarificationAnswerRecord.clarificationAnswerId.length > 0
# Entity: ClarificationAnswerRecord
# Description: Answer must have identity — anonymous answers cannot be traced to the unknown they resolve
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationAnswerRecord.clarificationAnswerId !== null && clarificationAnswerRecord.clarificationAnswerId.length > 0
exit 0
