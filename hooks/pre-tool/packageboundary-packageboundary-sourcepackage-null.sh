#!/bin/bash
# Invariant: packageBoundary.sourcePackage !== null
# Entity: PackageBoundary
# Description: Package origin must be traceable — without this provenance across bounded contexts breaks
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: packageBoundary.sourcePackage !== null
exit 0
