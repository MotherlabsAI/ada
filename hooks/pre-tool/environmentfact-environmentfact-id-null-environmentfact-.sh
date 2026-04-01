#!/bin/bash
# Invariant: environmentFact.id !== null && environmentFact.id.length > 0
# Entity: EnvironmentFact
# Description: facts must be uniquely identified for deduplication and rollback
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: environmentFact.id !== null && environmentFact.id.length > 0
exit 0
