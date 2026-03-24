#!/bin/bash
# Invariant: ambiguitySet.entityCount > 1
# Entity: AmbiguitySet
# Description: An ambiguity set must have more than one entity — a single-entity set is not ambiguous and cannot be disambiguated
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ambiguitySet.entityCount > 1
exit 0
