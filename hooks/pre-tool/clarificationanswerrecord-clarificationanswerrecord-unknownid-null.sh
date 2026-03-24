#!/bin/bash
# Invariant: clarificationAnswerRecord.unknownId !== null
# Entity: ClarificationAnswerRecord
# Description: ClarificationAnswer must reference the same unknown as the ClarificationRequest it answers — without this, the answer cannot be mapped to the correct DraftIntentGraph field
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationAnswerRecord.unknownId !== null
exit 0
