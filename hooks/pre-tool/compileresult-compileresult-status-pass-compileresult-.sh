#!/bin/bash
# Invariant: compileResult.status === 'PASS' || compileResult.status === 'FAIL'
# Entity: CompileResult
# Description: status must be a terminal typed value — any other state means the pipeline has not resolved, violating G1
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compileResult.status === 'PASS' || compileResult.status === 'FAIL'
exit 0
