#!/bin/bash
# Invariant: compileResult.pipelineState !== null
# Entity: CompileResult
# Description: Pipeline state must be present — it is the complete snapshot required for post-compile inspection
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compileResult.pipelineState !== null
exit 0
