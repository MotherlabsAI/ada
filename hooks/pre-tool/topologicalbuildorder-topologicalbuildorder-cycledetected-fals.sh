#!/bin/bash
# Invariant: topologicalBuildOrder.cycleDetected === false
# Entity: TopologicalBuildOrder
# Description: topological order must contain no cycles — a cycle makes build order undefined
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: topologicalBuildOrder.cycleDetected === false
exit 0
