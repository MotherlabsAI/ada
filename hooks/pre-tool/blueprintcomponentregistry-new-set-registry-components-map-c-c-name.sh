#!/bin/bash
# Invariant: new Set(registry.components.map(c => c.name)).size === 10
# Entity: BlueprintComponentRegistry
# Description: all component names must be unique — duplicate names corrupt the mapping function's domain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: new Set(registry.components.map(c => c.name)).size === 10
exit 0
