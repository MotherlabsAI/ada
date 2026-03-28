#!/bin/bash
# Invariant: compileResult.status !== null
# Entity: CompileResult
# Description: without a status the pipeline has no terminal signal and downstream consumers cannot determine success or failure
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compileResult.status !== null
exit 0
