#!/bin/bash
# Invariant: declarationEmit.dtsFiles.length > 0
# Entity: DeclarationEmit
# Description: declaration emit must produce at least one .d.ts file
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: declarationEmit.dtsFiles.length > 0
exit 0
