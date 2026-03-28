#!/bin/bash
# Invariant: entity.label !== null && entity.label.length > 0
# Entity: CanonicalEntity
# Description: a nameless entity cannot be referenced by downstream stages
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entity.label !== null && entity.label.length > 0
exit 0
