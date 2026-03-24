#!/bin/bash
# Invariant: compileResult.blueprint !== null
# Entity: CompileResult
# Description: Blueprint must be present — a compile result without output is not a result
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compileResult.blueprint !== null
exit 0
