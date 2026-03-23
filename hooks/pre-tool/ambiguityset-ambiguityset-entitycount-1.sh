#!/bin/bash
# Invariant: ambiguitySet.entityCount >= 1
# Entity: AmbiguitySet
# Description: an ambiguity set is non-empty when it exists
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ambiguitySet.entityCount >= 1
exit 0
