#!/bin/bash
# Invariant: environmentFact.observedAt > 0
# Entity: EnvironmentFact
# Description: observedAt must be a positive epoch timestamp for temporal ordering
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: environmentFact.observedAt > 0
exit 0
