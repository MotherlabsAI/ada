#!/bin/bash
# Invariant: codebaseContext.vocabulary.length >= 1
# Entity: CodebaseContext
# Description: the vocabulary must be non-empty — an empty vocabulary cannot ground the INT stage LLM calls
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codebaseContext.vocabulary.length >= 1
exit 0
