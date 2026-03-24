#!/bin/bash
# Invariant: clarificationRequestRecord.clarificationRequestId !== null && clarificationRequestRecord.clarificationRequestId.length > 0
# Entity: ClarificationRequestRecord
# Description: Request must have identity — anonymous requests cannot be matched to answers
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationRequestRecord.clarificationRequestId !== null && clarificationRequestRecord.clarificationRequestId.length > 0
exit 0
