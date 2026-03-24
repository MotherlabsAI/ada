#!/bin/bash
# Invariant: codeSymbol.line > 0
# Entity: CodeSymbol
# Description: Symbol line number must be positive — line zero is not a valid source location
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codeSymbol.line > 0
exit 0
