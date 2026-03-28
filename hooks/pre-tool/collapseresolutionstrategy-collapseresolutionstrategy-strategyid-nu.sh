#!/bin/bash
# Invariant: collapseResolutionStrategy.strategyId !== null && collapseResolutionStrategy.strategyId.length > 0
# Entity: CollapseResolutionStrategy
# Description: the strategy must be uniquely identified so the C3AssignmentGap can reference exactly which strategy resolved it
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: collapseResolutionStrategy.strategyId !== null && collapseResolutionStrategy.strategyId.length > 0
exit 0
