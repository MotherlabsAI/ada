#!/bin/bash
# Invariant: blueprint.dataModel !== null && blueprint.processModel !== null
# Entity: Blueprint
# Description: both data model and process model must be present for the Blueprint to be complete
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.dataModel !== null && blueprint.processModel !== null
exit 0
