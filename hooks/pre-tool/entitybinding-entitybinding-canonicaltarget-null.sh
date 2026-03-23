#!/bin/bash
# Invariant: entityBinding.canonicalTarget !== null
# Entity: EntityBinding
# Description: every binding must reference a canonical target
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityBinding.canonicalTarget !== null
exit 0
