#!/bin/bash
# Invariant: rawIntent.characterCount === rawIntent.text.length
# Entity: RawIntent
# Description: Character count must match actual text length — a mismatch indicates corrupt capture
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: rawIntent.characterCount === rawIntent.text.length
exit 0
