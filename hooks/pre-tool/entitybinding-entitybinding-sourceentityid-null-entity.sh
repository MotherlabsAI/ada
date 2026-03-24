#!/bin/bash
# Invariant: entityBinding.sourceEntityId !== null && entityBinding.sourceEntityId.length > 0
# Entity: EntityBinding
# Description: Source entity must be identified — a binding without a source is structurally incomplete
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityBinding.sourceEntityId !== null && entityBinding.sourceEntityId.length > 0
exit 0
