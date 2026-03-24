#!/bin/bash
# Invariant: resolvedConflict.process !== null && resolvedConflict.process.length > 0
# Entity: ResolvedConflict
# Description: resolved conflict must name the process involved
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: resolvedConflict.process !== null && resolvedConflict.process.length > 0
exit 0
