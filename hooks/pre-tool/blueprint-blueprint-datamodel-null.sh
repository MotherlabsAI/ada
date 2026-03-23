#!/bin/bash
# Invariant: blueprint.dataModel !== null
# Entity: Blueprint
# Description: blueprint must embed a data model — a blueprint without entities is structurally incomplete
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.dataModel !== null
exit 0
