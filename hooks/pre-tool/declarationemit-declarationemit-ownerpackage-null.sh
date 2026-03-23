#!/bin/bash
# Invariant: declarationEmit.ownerPackage !== null
# Entity: DeclarationEmit
# Description: declaration emit must be associated with an owner package
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: declarationEmit.ownerPackage !== null
exit 0
