#!/bin/bash
# Invariant: codebaseContext.typeRegistry !== null
# Entity: CodebaseContext
# Description: Type registry must exist — it is the structural ground truth for codebase-aware compilation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codebaseContext.typeRegistry !== null
exit 0
