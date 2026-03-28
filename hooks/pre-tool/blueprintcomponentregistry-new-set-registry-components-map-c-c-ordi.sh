#!/bin/bash
# Invariant: new Set(registry.components.map(c => c.ordinal)).size === 10
# Entity: BlueprintComponentRegistry
# Description: all 10 component ordinals must be distinct — duplicate ordinals would corrupt positional resolution
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: new Set(registry.components.map(c => c.ordinal)).size === 10
exit 0
