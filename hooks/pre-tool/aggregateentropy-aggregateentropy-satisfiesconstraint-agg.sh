#!/bin/bash
# Invariant: aggregateEntropy.satisfiesConstraint === (aggregateEntropy.value <= aggregateEntropy.hardCap)
# Entity: AggregateEntropy
# Description: satisfaction flag is derived from value vs hard cap comparison
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: aggregateEntropy.satisfiesConstraint === (aggregateEntropy.value <= aggregateEntropy.hardCap)
exit 0
