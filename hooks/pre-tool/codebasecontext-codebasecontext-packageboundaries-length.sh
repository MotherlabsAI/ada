#!/bin/bash
# Invariant: codebaseContext.packageBoundaries.length > 0
# Entity: CodebaseContext
# Description: at least one package boundary must be defined
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codebaseContext.packageBoundaries.length > 0
exit 0
