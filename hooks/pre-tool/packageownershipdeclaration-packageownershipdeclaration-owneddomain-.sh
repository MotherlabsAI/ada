#!/bin/bash
# Invariant: packageOwnershipDeclaration.ownedDomain !== null && packageOwnershipDeclaration.ownedDomain.length > 0
# Entity: PackageOwnershipDeclaration
# Description: the declaration must name the domain being owned; an empty domain means the ownership claim is unscoped and cannot answer G9
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: packageOwnershipDeclaration.ownedDomain !== null && packageOwnershipDeclaration.ownedDomain.length > 0
exit 0
