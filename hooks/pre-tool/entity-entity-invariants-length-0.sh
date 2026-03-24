#!/bin/bash
# Invariant: entity.invariants.length > 0
# Entity: Entity
# Description: entity must have at least one invariant
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entity.invariants.length > 0
exit 0
