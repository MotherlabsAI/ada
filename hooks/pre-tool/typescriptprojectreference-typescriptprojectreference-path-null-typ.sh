#!/bin/bash
# Invariant: typeScriptProjectReference.path !== null && typeScriptProjectReference.path.length > 0
# Entity: TypeScriptProjectReference
# Description: the reference must point to a real tsconfig path; an empty path causes TypeScript to silently drop the reference
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: typeScriptProjectReference.path !== null && typeScriptProjectReference.path.length > 0
exit 0
