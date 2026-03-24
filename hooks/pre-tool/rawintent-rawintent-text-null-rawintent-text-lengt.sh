#!/bin/bash
# Invariant: rawIntent.text !== null && rawIntent.text.length > 0
# Entity: RawIntent
# Description: Raw intent must contain text — empty text cannot be elicited from
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: rawIntent.text !== null && rawIntent.text.length > 0
exit 0
