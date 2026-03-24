#!/bin/bash
# Invariant: clarificationRequest.unknownId !== null && clarificationRequest.unknownId.length > 0
# Entity: ClarificationRequest
# Description: Unknown ID must reference an existing IntentUnknown — without this the clarification cannot be correlated to the originating gap
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationRequest.unknownId !== null && clarificationRequest.unknownId.length > 0
exit 0
