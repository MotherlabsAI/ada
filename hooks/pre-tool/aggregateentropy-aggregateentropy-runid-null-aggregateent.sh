#!/bin/bash
# Invariant: aggregateEntropy.runId !== null && aggregateEntropy.runId.length > 0
# Entity: AggregateEntropy
# Description: aggregate entropy is always scoped to a run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: aggregateEntropy.runId !== null && aggregateEntropy.runId.length > 0
exit 0
