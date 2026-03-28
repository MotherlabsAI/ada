#!/bin/bash
# Invariant: packageOwnershipDeclaration.isENTOwner === true || packageOwnershipDeclaration.ownedDomain !== 'ENT'
# Entity: PackageOwnershipDeclaration
# Description: if the domain is ENT, isENTOwner must be true; a mismatch means the flag is stale and G9 would return a wrong answer
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: packageOwnershipDeclaration.isENTOwner === true || packageOwnershipDeclaration.ownedDomain !== 'ENT'
exit 0
