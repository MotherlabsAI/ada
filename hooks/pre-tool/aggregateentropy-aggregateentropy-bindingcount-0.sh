#!/bin/bash
# Invariant: aggregateEntropy.bindingCount >= 0
# Entity: AggregateEntropy
# Description: binding count is non-negative
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: aggregateEntropy.bindingCount >= 0
exit 0
