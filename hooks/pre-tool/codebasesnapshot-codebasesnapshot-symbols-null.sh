#!/bin/bash
# Invariant: codebaseSnapshot.symbols !== null
# Entity: CodebaseSnapshot
# Description: symbols collection must be present
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codebaseSnapshot.symbols !== null
exit 0
