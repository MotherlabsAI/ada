#!/bin/bash
# Invariant: aggregateEntropy.satisfiesConstraint === (aggregateEntropy.value <= aggregateEntropy.hardCap)
# Entity: AggregateEntropy
# Description: Constraint satisfaction flag must be consistent with value and cap — inconsistency would corrupt SYN gate evaluation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: aggregateEntropy.satisfiesConstraint === (aggregateEntropy.value <= aggregateEntropy.hardCap)
exit 0
