#!/bin/bash
# Invariant: codebaseContext.typeRegistry.length >= 1
# Entity: CodebaseContext
# Description: the type registry must contain at least one entry — an empty registry cannot ground the ENT stage entity extraction
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codebaseContext.typeRegistry.length >= 1
exit 0
