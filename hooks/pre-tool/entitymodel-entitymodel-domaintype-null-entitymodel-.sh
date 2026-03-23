#!/bin/bash
# Invariant: entityModel.domainType !== null && entityModel.domainType.length > 0
# Entity: EntityModel
# Description: entity model must declare its domain type
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityModel.domainType !== null && entityModel.domainType.length > 0
exit 0
