#!/bin/bash
# Invariant: clarificationRequestRecord.unknownId !== null && clarificationRequestRecord.unknownId.length > 0
# Entity: ClarificationRequestRecord
# Description: ClarificationRequest must reference a specific unknown — without this, the request cannot be targeted to a DraftIntentGraph field
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationRequestRecord.unknownId !== null && clarificationRequestRecord.unknownId.length > 0
exit 0
