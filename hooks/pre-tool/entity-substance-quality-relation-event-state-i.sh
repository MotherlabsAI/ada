#!/bin/bash
# Invariant: ["substance","quality","relation","event","state"].includes(entity.category)
# Entity: Entity
# Description: Category must be a known ontological class — without this, the entity cannot be placed in the structural taxonomy
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ["substance","quality","relation","event","state"].includes(entity.category)
exit 0
