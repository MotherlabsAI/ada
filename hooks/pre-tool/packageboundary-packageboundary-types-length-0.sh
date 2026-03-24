#!/bin/bash
# Invariant: packageBoundary.types.length > 0
# Entity: PackageBoundary
# Description: A package with no types has no structural contribution to Ada's type system
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: packageBoundary.types.length > 0
exit 0
