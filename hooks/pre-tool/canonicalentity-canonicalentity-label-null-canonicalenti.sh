#!/bin/bash
# Invariant: canonicalEntity.label !== null && canonicalEntity.label.length > 0
# Entity: CanonicalEntity
# Description: entity must have a non-empty label
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: canonicalEntity.label !== null && canonicalEntity.label.length > 0
exit 0
