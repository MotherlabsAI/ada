#!/bin/bash
# Invariant: projectReference.sourcePackage !== projectReference.referencedPackage
# Entity: ProjectReference
# Description: a package cannot reference itself
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: projectReference.sourcePackage !== projectReference.referencedPackage
exit 0
