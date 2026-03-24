#!/bin/bash
# Invariant: resolvedConflict.resolution !== null && resolvedConflict.resolution.length > 0
# Entity: ResolvedConflict
# Description: Resolution must be non-empty — an unresolved conflict description is not a resolution
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: resolvedConflict.resolution !== null && resolvedConflict.resolution.length > 0
exit 0
