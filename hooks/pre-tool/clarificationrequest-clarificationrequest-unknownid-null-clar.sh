#!/bin/bash
# Invariant: clarificationRequest.unknownId !== null && clarificationRequest.unknownId.length > 0
# Entity: ClarificationRequest
# Description: must reference an existing IntentUnknown by id
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationRequest.unknownId !== null && clarificationRequest.unknownId.length > 0
exit 0
