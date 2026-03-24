#!/bin/bash
# Invariant: resolvedConflict.entity !== null && resolvedConflict.entity.length > 0
# Entity: ResolvedConflict
# Description: Entity reference must be non-empty — a conflict without an entity anchor cannot be traced
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: resolvedConflict.entity !== null && resolvedConflict.entity.length > 0
exit 0
