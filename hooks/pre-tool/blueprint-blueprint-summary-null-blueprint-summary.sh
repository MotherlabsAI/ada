#!/bin/bash
# Invariant: blueprint.summary !== null && blueprint.summary.length > 0
# Entity: Blueprint
# Description: Blueprint must have a summary — the vision document requires a nameable synthesis output
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.summary !== null && blueprint.summary.length > 0
exit 0
