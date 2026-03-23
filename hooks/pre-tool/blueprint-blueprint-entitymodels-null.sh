#!/bin/bash
# Invariant: blueprint.entityModels !== null
# Entity: Blueprint
# Description: entity models collection must be initialized
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.entityModels !== null
exit 0
