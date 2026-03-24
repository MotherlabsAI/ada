#!/bin/bash
# Invariant: rawIntent.sessionId !== null
# Entity: RawIntent
# Description: Raw intent must be bound to exactly one session — without this, provenance is broken
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: rawIntent.sessionId !== null
exit 0
