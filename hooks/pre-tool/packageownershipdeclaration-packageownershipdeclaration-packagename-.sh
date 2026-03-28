#!/bin/bash
# Invariant: packageOwnershipDeclaration.packageName !== null
# Entity: PackageOwnershipDeclaration
# Description: every declaration must name the owning package; null package name makes G9 unanswerable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: packageOwnershipDeclaration.packageName !== null
exit 0
