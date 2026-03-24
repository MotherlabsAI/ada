#!/bin/bash
# Invariant: ["interface","type"].includes(typeRegistryEntry.kind)
# Entity: TypeRegistryEntry
# Description: Kind must be a known TypeScript declaration form
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ["interface","type"].includes(typeRegistryEntry.kind)
exit 0
