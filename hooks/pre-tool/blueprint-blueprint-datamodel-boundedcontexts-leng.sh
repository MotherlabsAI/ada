#!/bin/bash
# Invariant: blueprint.dataModel.boundedContexts.length >= 1
# Entity: Blueprint
# Description: Blueprint must contain at least one bounded context in its data model
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.dataModel.boundedContexts.length >= 1
exit 0
