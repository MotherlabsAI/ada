#!/bin/bash
# Invariant: entity.properties.length >= 1
# Entity: Entity
# Description: Every entity must have at least one property — propertyless entities carry no structural information
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entity.properties.length >= 1
exit 0
