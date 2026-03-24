#!/bin/bash
# Invariant: ambiguitySet.setId !== null && ambiguitySet.setId.length > 0
# Entity: AmbiguitySet
# Description: Ambiguity set must have identity — anonymous sets cannot be targeted by disambiguation passes
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ambiguitySet.setId !== null && ambiguitySet.setId.length > 0
exit 0
