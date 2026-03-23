#!/bin/bash
# Invariant: blueprint.governanceStatus !== null
# Entity: Blueprint
# Description: governance status must be present on every blueprint
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.governanceStatus !== null
exit 0
