#!/bin/bash
# Invariant: entitySet26.members.length === 26
# Entity: EntitySet26
# Description: members array length matches declared cardinality
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entitySet26.members.length === 26
exit 0
