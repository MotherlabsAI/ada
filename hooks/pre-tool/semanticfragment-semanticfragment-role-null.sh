#!/bin/bash
# Invariant: semanticFragment.role !== null
# Entity: SemanticFragment
# Description: fragment must have an assigned semantic role
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: semanticFragment.role !== null
exit 0
