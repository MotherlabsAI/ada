#!/bin/bash
# Invariant: typeRegistryEntry.sourcePackage !== null
# Entity: TypeRegistryEntry
# Description: Every type must declare its package origin — cross-package convergence mapping requires this
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: typeRegistryEntry.sourcePackage !== null
exit 0
