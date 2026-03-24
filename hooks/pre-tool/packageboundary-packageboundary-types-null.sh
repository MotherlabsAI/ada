#!/bin/bash
# Invariant: packageBoundary.types !== null
# Entity: PackageBoundary
# Description: Types array must exist — even empty, it is required for type ownership attribution
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: packageBoundary.types !== null
exit 0
