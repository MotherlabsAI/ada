#!/bin/bash
# Invariant: blueprint.summary !== null && blueprint.summary.trim().length > 0
# Entity: Blueprint
# Description: blueprint must carry a non-empty summary
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.summary !== null && blueprint.summary.trim().length > 0
exit 0
