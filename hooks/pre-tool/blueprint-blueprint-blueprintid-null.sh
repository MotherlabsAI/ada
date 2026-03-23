#!/bin/bash
# Invariant: blueprint.blueprintId !== null
# Entity: Blueprint
# Description: blueprint must have a unique id
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.blueprintId !== null
exit 0
