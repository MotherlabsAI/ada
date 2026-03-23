#!/bin/bash
# Invariant: compileResult.iterationCount >= 1
# Entity: CompileResult
# Description: at least one pipeline iteration must have occurred
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compileResult.iterationCount >= 1
exit 0
