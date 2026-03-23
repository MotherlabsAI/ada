#!/bin/bash
# Invariant: declarationEmit.typesEntryPoint !== null && declarationEmit.typesEntryPoint.endsWith('.d.ts')
# Entity: DeclarationEmit
# Description: the types entry point must be a .d.ts file
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: declarationEmit.typesEntryPoint !== null && declarationEmit.typesEntryPoint.endsWith('.d.ts')
exit 0
