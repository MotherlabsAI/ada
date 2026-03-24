#!/bin/bash
# Invariant: ['interface','type','class','function','const','enum'].includes(codeSymbol.kind)
# Entity: CodeSymbol
# Description: symbol kind must be one of the six defined values
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ['interface','type','class','function','const','enum'].includes(codeSymbol.kind)
exit 0
