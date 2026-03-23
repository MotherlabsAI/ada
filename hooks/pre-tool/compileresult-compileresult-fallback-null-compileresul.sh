#!/bin/bash
# Invariant: compileResult.fallback !== null ? compileResult.status !== 'accepted' : true
# Entity: CompileResult
# Description: a fallback result is only present when the compile did not reach ACCEPT
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compileResult.fallback !== null ? compileResult.status !== 'accepted' : true
exit 0
