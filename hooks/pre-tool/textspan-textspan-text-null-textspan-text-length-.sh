#!/bin/bash
# Invariant: textSpan.text !== null && textSpan.text.length > 0
# Entity: TextSpan
# Description: span must reference non-empty text
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: textSpan.text !== null && textSpan.text.length > 0
exit 0
