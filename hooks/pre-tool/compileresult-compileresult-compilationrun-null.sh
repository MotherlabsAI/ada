#!/bin/bash
# Invariant: compileResult.compilationRun !== null
# Entity: CompileResult
# Description: compilationRun must be non-null — every CompileResult must be anchored to a specific compilation run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compileResult.compilationRun !== null
exit 0
