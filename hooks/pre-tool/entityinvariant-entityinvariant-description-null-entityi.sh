#!/bin/bash
# Invariant: entityInvariant.description !== null && entityInvariant.description.length > 0
# Entity: EntityInvariant
# Description: Description must be non-empty — without human-readable rationale, the Governor cannot assess why an invariant matters
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityInvariant.description !== null && entityInvariant.description.length > 0
exit 0
