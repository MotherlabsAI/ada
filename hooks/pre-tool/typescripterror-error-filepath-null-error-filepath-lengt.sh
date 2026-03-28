#!/bin/bash
# Invariant: error.filePath !== null && error.filePath.length > 0
# Entity: TypeScriptError
# Description: an error without a file path cannot be located and fixed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: error.filePath !== null && error.filePath.length > 0
exit 0
