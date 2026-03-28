#!/bin/bash
# Invariant: error.errorCode !== null && error.errorCode.length > 0
# Entity: TypeScriptError
# Description: a TypeScript error without a code cannot be cross-referenced in documentation or suppression lists
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: error.errorCode !== null && error.errorCode.length > 0
exit 0
