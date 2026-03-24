#!/bin/bash
# Invariant: typeRegistryEntry.name !== null && typeRegistryEntry.name.length > 0
# Entity: TypeRegistryEntry
# Description: Every type must be named — the vocabulary synthesis in G5 depends on named types
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: typeRegistryEntry.name !== null && typeRegistryEntry.name.length > 0
exit 0
