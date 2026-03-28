#!/bin/bash
# Invariant: error.line >= 1
# Entity: TypeScriptError
# Description: line numbers must be 1-based positive integers — zero or negative means the location is not resolved
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: error.line >= 1
exit 0
