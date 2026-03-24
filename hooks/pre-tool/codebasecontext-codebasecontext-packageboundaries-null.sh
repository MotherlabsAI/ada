#!/bin/bash
# Invariant: codebaseContext.packageBoundaries !== null
# Entity: CodebaseContext
# Description: Package boundaries must exist — without them entity extraction cannot respect monorepo context isolation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codebaseContext.packageBoundaries !== null
exit 0
