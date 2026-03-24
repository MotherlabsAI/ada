#!/bin/bash
# Invariant: typeRegistryEntry.sourcePackage !== null && typeRegistryEntry.sourcePackage.length > 0
# Entity: TypeRegistryEntry
# Description: Source package must be identified — without it the type cannot be attributed to a bounded context
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: typeRegistryEntry.sourcePackage !== null && typeRegistryEntry.sourcePackage.length > 0
exit 0
