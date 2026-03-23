#!/bin/bash
# Invariant: entity.invariants.length >= 1
# Entity: Entity
# Description: entity must declare at least one invariant — unconstrained entities are not permitted
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entity.invariants.length >= 1
exit 0
