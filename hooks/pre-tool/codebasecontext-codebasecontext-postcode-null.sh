#!/bin/bash
# Invariant: codebaseContext.postcode !== null
# Entity: CodebaseContext
# Description: PostcodeAddress must be present — CodebaseContext is a provenance-bearing artifact
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codebaseContext.postcode !== null
exit 0
