#!/bin/bash
# Invariant: textSpan.endIndex > textSpan.startIndex
# Entity: TextSpan
# Description: span end must be after start
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: textSpan.endIndex > textSpan.startIndex
exit 0
