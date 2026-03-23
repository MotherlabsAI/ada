#!/bin/bash
# Invariant: aggregateEntropy.bindingCount === 0 ? aggregateEntropy.value === 0 : true
# Entity: AggregateEntropy
# Description: aggregate entropy over zero bindings is defined as zero
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: aggregateEntropy.bindingCount === 0 ? aggregateEntropy.value === 0 : true
exit 0
