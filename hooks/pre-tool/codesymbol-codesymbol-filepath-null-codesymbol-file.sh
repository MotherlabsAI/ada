#!/bin/bash
# Invariant: codeSymbol.filePath !== null && codeSymbol.filePath.length > 0
# Entity: CodeSymbol
# Description: Symbol must have a file path — pathless symbols cannot be located in the codebase snapshot
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codeSymbol.filePath !== null && codeSymbol.filePath.length > 0
exit 0
