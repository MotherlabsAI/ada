#!/bin/bash
# Invariant: packageBoundary.name !== null && packageBoundary.name.length > 0
# Entity: PackageBoundary
# Description: Every package must be named — anonymous packages cannot be referenced in the architectural vision
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: packageBoundary.name !== null && packageBoundary.name.length > 0
exit 0
