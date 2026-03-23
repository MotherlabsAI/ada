#!/bin/bash
# Invariant: blueprint.determinismMetadata !== null
# Entity: Blueprint
# Description: determinism metadata must be recorded
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.determinismMetadata !== null
exit 0
