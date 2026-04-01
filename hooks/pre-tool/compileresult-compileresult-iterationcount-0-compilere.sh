#!/bin/bash
# Invariant: compileResult.iterationCount >= 0 && compileResult.iterationCount <= 3
# Entity: CompileResult
# Description: iterationCount must be in [0,3] — max 3 GOV iterations before pipeline must terminate
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compileResult.iterationCount >= 0 && compileResult.iterationCount <= 3
exit 0
