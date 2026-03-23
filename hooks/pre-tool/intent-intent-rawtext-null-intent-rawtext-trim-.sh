#!/bin/bash
# Invariant: intent.rawText !== null && intent.rawText.trim().length > 0
# Entity: Intent
# Description: intent must contain non-empty text
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intent.rawText !== null && intent.rawText.trim().length > 0
exit 0
