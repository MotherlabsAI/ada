#!/bin/bash
# Invariant: collapseResolutionStrategy.priorOccupantComponentIds.length >= 1
# Entity: CollapseResolutionStrategy
# Description: collapse means joining an already-occupied package; zero prior occupants means this is not a collapse but a fresh assignment
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: collapseResolutionStrategy.priorOccupantComponentIds.length >= 1
exit 0
