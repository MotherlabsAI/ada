#!/bin/bash
# Invariant: amendment.description !== null && amendment.description.length > 0
# Entity: Amendment
# Description: an amendment with no description cannot be reviewed by the human operator
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: amendment.description !== null && amendment.description.length > 0
exit 0
