#!/bin/bash
# Invariant: semanticFragment.fragmentId !== null
# Entity: SemanticFragment
# Description: fragment must have a unique identifier
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: semanticFragment.fragmentId !== null
exit 0
