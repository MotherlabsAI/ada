#!/bin/bash
# Invariant: topologicalBuildOrder.orderedPackages.length === new Set(topologicalBuildOrder.orderedPackages).size
# Entity: TopologicalBuildOrder
# Description: each package must appear exactly once in the ordered list
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: topologicalBuildOrder.orderedPackages.length === new Set(topologicalBuildOrder.orderedPackages).size
exit 0
