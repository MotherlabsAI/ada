#!/bin/bash
# Invariant: compileResult.blueprint !== null
# Entity: CompileResult
# Description: a successful CompileResult must carry a blueprint; its absence means the pipeline never reached synthesis
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compileResult.blueprint !== null
exit 0
