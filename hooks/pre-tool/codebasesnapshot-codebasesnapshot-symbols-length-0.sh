#!/bin/bash
# Invariant: codebaseSnapshot.symbols.length > 0
# Entity: CodebaseSnapshot
# Description: Snapshot must contain at least one symbol — an empty snapshot cannot be verified against a blueprint
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codebaseSnapshot.symbols.length > 0
exit 0
