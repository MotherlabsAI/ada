#!/bin/bash
# Invariant: compileResult.status !== null
# Entity: CompileResult
# Description: status must be non-null — it determines whether the pipeline succeeded or failed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compileResult.status !== null
exit 0
