#!/bin/bash
# Invariant: aggregateEntropy.hardCap > 0
# Entity: AggregateEntropy
# Description: Hard cap must be positive — a zero or negative cap would block all pipeline runs
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: aggregateEntropy.hardCap > 0
exit 0
