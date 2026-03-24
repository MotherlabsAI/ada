#!/bin/bash
# Invariant: clarificationRequestRecord.createdAt > 0
# Entity: ClarificationRequestRecord
# Description: Creation timestamp must be positive — unordered requests corrupt session sequencing
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationRequestRecord.createdAt > 0
exit 0
