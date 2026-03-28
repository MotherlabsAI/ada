#!/bin/bash
# Invariant: registry.components.every(c => c.ordinal >= 0 && c.ordinal <= 9)
# Entity: BlueprintComponentRegistry
# Description: ordinals must be in the range 0–9 to form a contiguous positional index
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: registry.components.every(c => c.ordinal >= 0 && c.ordinal <= 9)
exit 0
