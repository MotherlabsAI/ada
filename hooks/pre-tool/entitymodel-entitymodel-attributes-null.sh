#!/bin/bash
# Invariant: entityModel.attributes !== null
# Entity: EntityModel
# Description: attributes list must be initialized
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityModel.attributes !== null
exit 0
