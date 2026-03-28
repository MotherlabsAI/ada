#!/bin/bash
# Invariant: registry.registryId !== null && registry.registryId.length > 0
# Entity: BlueprintComponentRegistry
# Description: a registry without an identity cannot be referenced by downstream mappings
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: registry.registryId !== null && registry.registryId.length > 0
exit 0
