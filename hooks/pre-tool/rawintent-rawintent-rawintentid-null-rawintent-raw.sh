#!/bin/bash
# Invariant: rawIntent.rawIntentId !== null && rawIntent.rawIntentId.length > 0
# Entity: RawIntent
# Description: Raw intent must have identity — anonymous raw intent cannot be referenced by draft or session
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: rawIntent.rawIntentId !== null && rawIntent.rawIntentId.length > 0
exit 0
