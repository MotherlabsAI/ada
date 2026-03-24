#!/bin/bash
# Invariant: ambiguitySet.entityCount > 0
# Entity: AmbiguitySet
# Description: ambiguity set must contain at least one entity
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ambiguitySet.entityCount > 0
exit 0
