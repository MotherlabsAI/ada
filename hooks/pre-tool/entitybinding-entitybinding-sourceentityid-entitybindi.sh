#!/bin/bash
# Invariant: entityBinding.sourceEntityId !== entityBinding.canonicalTargetId
# Entity: EntityBinding
# Description: source and canonical target must be distinct entities
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityBinding.sourceEntityId !== entityBinding.canonicalTargetId
exit 0
