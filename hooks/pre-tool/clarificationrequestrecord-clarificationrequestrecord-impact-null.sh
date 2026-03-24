#!/bin/bash
# Invariant: clarificationRequestRecord.impact !== null
# Entity: ClarificationRequestRecord
# Description: ClarificationRequest must declare its impact — without this, Gap severity and elicitation priority cannot be determined
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationRequestRecord.impact !== null
exit 0
