#!/bin/bash
# Invariant: rawIntent.text !== null && rawIntent.text.trim().length > 0
# Entity: RawIntent
# Description: Raw intent must contain non-empty text — without this, there is nothing to elicit from and the session cannot begin
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: rawIntent.text !== null && rawIntent.text.trim().length > 0
exit 0
