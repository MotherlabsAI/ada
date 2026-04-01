#!/bin/bash
# Invariant: blueprint.architecture.components.length >= 1
# Entity: Blueprint
# Description: a blueprint with no architecture components has no executable structure — it cannot govern execution
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.architecture.components.length >= 1
exit 0
