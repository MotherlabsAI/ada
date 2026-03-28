#!/bin/bash
# Invariant: collapseResolutionStrategy.isApplied === false || collapseResolutionStrategy.targetGapId !== null
# Entity: CollapseResolutionStrategy
# Description: an applied strategy must reference the gap it resolved; without this the C3AssignmentGap cannot trace its resolution
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: collapseResolutionStrategy.isApplied === false || collapseResolutionStrategy.targetGapId !== null
exit 0
