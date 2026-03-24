#!/bin/bash
# Invariant: aggregateEntropy.hardCap === 0.3
# Entity: AggregateEntropy
# Description: Hard cap must be exactly 0.3 — this is a fixed architectural constant not configurable at runtime
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: aggregateEntropy.hardCap === 0.3
exit 0
