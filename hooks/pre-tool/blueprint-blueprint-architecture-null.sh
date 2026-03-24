#!/bin/bash
# Invariant: blueprint.architecture !== null
# Entity: Blueprint
# Description: Architecture must be present — a blueprint without structure cannot be verified against codebase
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.architecture !== null
exit 0
