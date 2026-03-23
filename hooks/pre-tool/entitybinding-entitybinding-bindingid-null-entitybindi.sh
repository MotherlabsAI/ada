#!/bin/bash
# Invariant: entityBinding.bindingId !== null && entityBinding.bindingId.length > 0
# Entity: EntityBinding
# Description: binding must have a non-empty identifier
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityBinding.bindingId !== null && entityBinding.bindingId.length > 0
exit 0
