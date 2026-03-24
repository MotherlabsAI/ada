#!/bin/bash
# Invariant: codeSymbol.line >= 1
# Entity: CodeSymbol
# Description: line number must be a positive integer
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codeSymbol.line >= 1
exit 0
