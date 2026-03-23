#!/bin/bash
# Invariant: entityBinding.sourceEntity !== null && entityBinding.sourceEntity.length > 0
# Entity: EntityBinding
# Description: binding must identify a source entity
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityBinding.sourceEntity !== null && entityBinding.sourceEntity.length > 0
exit 0
