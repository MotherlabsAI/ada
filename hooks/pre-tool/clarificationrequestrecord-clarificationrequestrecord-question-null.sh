#!/bin/bash
# Invariant: clarificationRequestRecord.question !== null && clarificationRequestRecord.question.length > 0
# Entity: ClarificationRequestRecord
# Description: Question must be non-empty — an empty clarification request elicits nothing
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationRequestRecord.question !== null && clarificationRequestRecord.question.length > 0
exit 0
