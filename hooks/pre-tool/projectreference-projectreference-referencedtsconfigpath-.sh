#!/bin/bash
# Invariant: projectReference.referencedTsConfigPath !== null && projectReference.referencedTsConfigPath.length > 0
# Entity: ProjectReference
# Description: reference must point to a concrete tsconfig path
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: projectReference.referencedTsConfigPath !== null && projectReference.referencedTsConfigPath.length > 0
exit 0
