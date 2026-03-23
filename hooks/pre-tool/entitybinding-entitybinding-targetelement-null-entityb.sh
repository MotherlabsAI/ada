#!/bin/bash
# Invariant: entityBinding.targetElement !== null && entityBinding.targetElement.length > 0
# Entity: EntityBinding
# Description: binding must identify a target schema element
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityBinding.targetElement !== null && entityBinding.targetElement.length > 0
exit 0
