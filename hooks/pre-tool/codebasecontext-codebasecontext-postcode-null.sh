#!/bin/bash
# Invariant: codebaseContext.postcode !== null
# Entity: CodebaseContext
# Description: the codebase context must be content-addressed — it is the CTX stage output and root of the compilation chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codebaseContext.postcode !== null
exit 0
