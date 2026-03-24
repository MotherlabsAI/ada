#!/bin/bash
# Invariant: entityMap.entities.every(e => e.invariants.length >= 1)
# Entity: EntityMap
# Description: Every entity must have at least one invariant — invariant-free entities are behaviorless data bags that cannot be audited
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.entities.every(e => e.invariants.length >= 1)
exit 0
