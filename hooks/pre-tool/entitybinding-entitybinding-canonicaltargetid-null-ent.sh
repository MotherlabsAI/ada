#!/bin/bash
# Invariant: entityBinding.canonicalTargetId !== null && entityBinding.canonicalTargetId.length > 0
# Entity: EntityBinding
# Description: Canonical target must be identified — a binding without a target resolves nothing
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityBinding.canonicalTargetId !== null && entityBinding.canonicalTargetId.length > 0
exit 0
