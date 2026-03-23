#!/bin/bash
# Invariant: aggregateEntropy.value >= 0 && aggregateEntropy.value <= 1
# Entity: AggregateEntropy
# Description: aggregate entropy is a unit scalar
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: aggregateEntropy.value >= 0 && aggregateEntropy.value <= 1
exit 0
