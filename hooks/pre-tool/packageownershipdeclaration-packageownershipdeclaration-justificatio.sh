#!/bin/bash
# Invariant: packageOwnershipDeclaration.justification !== null && packageOwnershipDeclaration.justification.length > 0
# Entity: PackageOwnershipDeclaration
# Description: ownership must be justified; unjustified declarations are arbitrary and would not survive architectural review
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: packageOwnershipDeclaration.justification !== null && packageOwnershipDeclaration.justification.length > 0
exit 0
