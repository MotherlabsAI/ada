#!/bin/bash
# Invariant: typeScriptProjectReference.referenceId !== null && typeScriptProjectReference.referenceId.length > 0
# Entity: TypeScriptProjectReference
# Description: references must be uniquely identified so duplicate edges in the project reference graph can be detected and removed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: typeScriptProjectReference.referenceId !== null && typeScriptProjectReference.referenceId.length > 0
exit 0
