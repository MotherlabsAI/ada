#!/bin/bash
# Invariant: codebaseContext.typeRegistry.length >= 0
# Entity: CodebaseContext
# Description: typeRegistry may be empty for a new project but must not be null — null breaks vocabulary injection into LLM stages
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codebaseContext.typeRegistry.length >= 0
exit 0
