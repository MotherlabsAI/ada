#!/bin/bash
# Invariant: aggregateEntropy.value >= 0
# Entity: AggregateEntropy
# Description: Aggregate entropy must be non-negative — negative values are not valid entropy measurements
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: aggregateEntropy.value >= 0
exit 0
