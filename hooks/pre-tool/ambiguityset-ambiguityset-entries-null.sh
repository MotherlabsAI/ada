#!/bin/bash
# Invariant: ambiguitySet.entries !== null
# Entity: AmbiguitySet
# Description: entries array must exist, even when empty
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ambiguitySet.entries !== null
exit 0
