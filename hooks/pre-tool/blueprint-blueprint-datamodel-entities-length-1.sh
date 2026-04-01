#!/bin/bash
# Invariant: blueprint.dataModel.entities.length >= 1
# Entity: Blueprint
# Description: the data model must contain at least one entity — an empty model means no invariants can be enforced
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.dataModel.entities.length >= 1
exit 0
