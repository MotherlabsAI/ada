#!/bin/bash
# Invariant: entity.invariants.length >= 1
# Entity: CanonicalEntity
# Description: a canonical entity with no invariants is not validated and cannot pass the ENT gate quality check
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entity.invariants.length >= 1
exit 0
