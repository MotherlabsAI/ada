#!/bin/bash
# Invariant: typeRegistryEntry.fields.length > 0
# Entity: TypeRegistryEntry
# Description: A type with no fields has no structural content to contribute to Ada's identity articulation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: typeRegistryEntry.fields.length > 0
exit 0
