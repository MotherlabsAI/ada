#!/bin/bash
# Invariant: entityBinding.bindingId !== null && entityBinding.bindingId.length > 0
# Entity: EntityBinding
# Description: Binding must have identity — anonymous bindings cannot be filtered or resolved
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityBinding.bindingId !== null && entityBinding.bindingId.length > 0
exit 0
