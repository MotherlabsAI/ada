#!/bin/bash
# Invariant: codeSymbol.name !== null && codeSymbol.name.length > 0
# Entity: CodeSymbol
# Description: Symbol must be named — anonymous symbols cannot be matched against blueprint components
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codeSymbol.name !== null && codeSymbol.name.length > 0
exit 0
