#!/bin/bash
# Invariant: collapseResolutionStrategy.targetComponentOrdinal === 3
# Entity: CollapseResolutionStrategy
# Description: this strategy resolves specifically the C3 gap; a strategy targeting another ordinal is a different entity
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: collapseResolutionStrategy.targetComponentOrdinal === 3
exit 0
