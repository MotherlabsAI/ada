#!/bin/bash
# Invariant: blueprintComponentRegistry.components.map(c => c.ordinal).every((o, i, arr) => arr.indexOf(o) === i)
# Entity: BlueprintComponentRegistry
# Description: ordinals must be unique within a registry; duplicate ordinals make the C3 gap resolution ambiguous
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintComponentRegistry.components.map(c => c.ordinal).every((o, i, arr) => arr.indexOf(o) === i)
exit 0
