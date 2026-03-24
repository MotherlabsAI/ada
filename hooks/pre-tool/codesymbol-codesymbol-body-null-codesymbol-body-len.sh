#!/bin/bash
# Invariant: codeSymbol.body !== null && codeSymbol.body.length > 0
# Entity: CodeSymbol
# Description: Symbol must have a body — a symbol with no body cannot be analyzed for invariant enforcement
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codeSymbol.body !== null && codeSymbol.body.length > 0
exit 0
