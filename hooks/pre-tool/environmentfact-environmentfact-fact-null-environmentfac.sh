#!/bin/bash
# Invariant: environmentFact.fact !== null && environmentFact.fact.length > 0
# Entity: EnvironmentFact
# Description: a fact with no content cannot contribute to world state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: environmentFact.fact !== null && environmentFact.fact.length > 0
exit 0
