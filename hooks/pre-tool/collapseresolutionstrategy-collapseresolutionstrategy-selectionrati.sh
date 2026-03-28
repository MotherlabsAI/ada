#!/bin/bash
# Invariant: collapseResolutionStrategy.selectionRationale !== null && collapseResolutionStrategy.selectionRationale.length > 0
# Entity: CollapseResolutionStrategy
# Description: collapse into an existing package must be justified; an empty rationale makes the resolution arbitrary and unauditable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: collapseResolutionStrategy.selectionRationale !== null && collapseResolutionStrategy.selectionRationale.length > 0
exit 0
