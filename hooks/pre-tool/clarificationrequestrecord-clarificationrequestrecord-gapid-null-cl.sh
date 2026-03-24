#!/bin/bash
# Invariant: clarificationRequestRecord.gapId !== null && clarificationRequestRecord.gapId.length > 0
# Entity: ClarificationRequestRecord
# Description: Request must reference a gap — clarification without a gap has no elicitation target
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationRequestRecord.gapId !== null && clarificationRequestRecord.gapId.length > 0
exit 0
