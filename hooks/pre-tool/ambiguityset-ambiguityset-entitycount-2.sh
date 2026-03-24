#!/bin/bash
# Invariant: ambiguitySet.entityCount >= 2
# Entity: AmbiguitySet
# Description: An ambiguity set must have at least 2 members — a single-member set is not ambiguous
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ambiguitySet.entityCount >= 2
exit 0
