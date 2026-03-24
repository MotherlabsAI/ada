#!/bin/bash
# Invariant: rawIntent.capturedAt !== null
# Entity: RawIntent
# Description: Raw intent must have a capture timestamp — without this, temporal ordering of the session is impossible
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: rawIntent.capturedAt !== null
exit 0
