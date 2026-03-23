#!/bin/bash
# Invariant: aggregateEntropy.hardCap === 0.30
# Entity: AggregateEntropy
# Description: hard cap is invariantly 0.30
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: aggregateEntropy.hardCap === 0.30
exit 0
